# Polaris — Application Architecture

This document describes the technical architecture of the Polaris Beauty Lounge booking platform. It covers the directory structure, data model, API design, authentication, payment system, background jobs, deployment, and the key decisions behind each.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Directory Structure](#2-directory-structure)
3. [Route Groups & Page Layout](#3-route-groups--page-layout)
4. [Authentication & Session Management](#4-authentication--session-management)
5. [Database & Data Model](#5-database--data-model)
6. [API Layer](#6-api-layer)
7. [Feature Module Pattern](#7-feature-module-pattern)
8. [Client-Side State Management](#8-client-side-state-management)
9. [Payment System](#9-payment-system)
10. [Background Jobs — Inngest](#10-background-jobs--inngest)
11. [External Services](#11-external-services)
12. [File Storage — MinIO](#12-file-storage--minio)
13. [Email & SMS Notifications](#13-email--sms-notifications)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Key Architectural Decisions](#15-key-architectural-decisions)

---

## 1. System Overview

Polaris is a **full-stack Next.js 16 application** that combines a customer-facing salon booking flow with an admin management dashboard. It is a monorepo: one Next.js app serves both the public-facing website and the internal admin panel.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│   Customer Flow (/customer/*)    Admin Dashboard (/(admin)/*)   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (Nginx/Caddy TLS termination)
┌────────────────────────▼────────────────────────────────────────┐
│               Next.js 16 Standalone Server                      │
│                                                                 │
│  App Router          API Routes         Server Components       │
│  (route groups)      (/api/*)           (data fetching)         │
└──────┬──────────────────┬───────────────────────────────────────┘
       │                  │
       │           ┌──────▼───────────────────────────────┐
       │           │         External Services             │
       │           │  Paystack ×2  │  Inngest  │  MinIO   │
       │           │  Google Cal   │  Resend   │  Arkesel │
       │           └──────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                     PostgreSQL (via Prisma 7)                   │
└─────────────────────────────────────────────────────────────────┘
```

**Tech stack at a glance:**

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `output: 'standalone'`) |
| Language | TypeScript 5 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 15 |
| Auth | Custom cookie-based sessions (`@oslojs/crypto`) |
| Client state | TanStack Query v5 |
| Forms | react-hook-form + Zod v4 |
| Payments | Paystack (dual-gateway) |
| Background jobs | Inngest |
| Email | Resend + React Email |
| SMS | Arkesel |
| File storage | MinIO (S3-compatible) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Container | Docker (multi-stage) + Portainer |

---

## 2. Directory Structure

```
next_polaris/
├── prisma/
│   ├── schema.prisma           # Full database schema
│   ├── seed.ts                 # Seed script (run with tsx)
│   └── migrations/             # Prisma migration files
├── prisma.config.ts            # Prisma 7 config (schema path, datasource URL)
├── generated/
│   └── prisma/                 # Generated Prisma client (output of `prisma generate`)
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/            # Admin route group
│   │   ├── (customer)/         # Customer route group
│   │   ├── _auth/              # Auth guard utilities
│   │   ├── _navigation/        # Admin sidebar
│   │   ├── api/                # All API route handlers
│   │   ├── login/ forgot-password/ reset-password/ unauthorized/
│   │   ├── layout.tsx          # Root layout (providers + toaster)
│   │   ├── paths.ts            # Typed path helpers
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── admin/              # Admin mobile header
│   │   ├── customer/           # Customer-facing UI components
│   │   │   ├── booking/        # Multi-step booking form
│   │   │   └── services/       # Service grid / carousel
│   │   ├── dashboard/          # Admin dashboard widgets
│   │   └── landing/            # Public landing page sections
│   ├── emails/
│   │   ├── booking/            # React Email templates (cancel, payment-link, received)
│   │   └── password/           # Password reset template
│   ├── features/               # Feature modules (see §7)
│   │   ├── auth/
│   │   ├── blocked-date/
│   │   ├── booking/
│   │   ├── business-hour/
│   │   ├── invoice/
│   │   ├── package/
│   │   ├── payment/
│   │   ├── promo-code/
│   │   ├── service/
│   │   ├── service-category/
│   │   ├── staff/
│   │   └── style-image/
│   ├── lib/
│   │   ├── api.ts              # Axios instance (auth interceptors)
│   │   ├── arkesal.ts          # Arkesel SMS client
│   │   ├── google-calendar.ts  # Google Calendar JWT client
│   │   ├── inngest.ts          # Inngest client + typed event schemas
│   │   ├── minio.ts            # MinIO S3-compatible client
│   │   ├── paystack.ts         # Paystack API (dual-gateway support)
│   │   ├── prisma.ts           # PrismaClient singleton
│   │   ├── prisma-includes.ts  # bookingInclude + BookingFull type
│   │   ├── react-query.tsx     # QueryClientProvider
│   │   └── resend.ts           # Resend email client
│   ├── types/
│   │   └── api.ts              # ApiError interface
│   └── utils/
│       ├── crypto.ts           # Session token / hash (oslo.js)
│       ├── helpers.ts          # Shared utilities
│       └── url.ts
├── docker-compose.yml
├── Dockerfile.prod
├── docker-entrypoint.sh
├── next.config.ts
└── package.json
```

---

## 3. Route Groups & Page Layout

Next.js route groups (`(admin)` and `(customer)`) give each surface its own layout without affecting the URL.

### Admin — `(admin)/`

Protected by `requireRole(['ADMIN'])` called at the top of every Server Component page. Unauthenticated → redirect `/login`. Wrong role → redirect `/unauthorized`.

**Layout:** Collapsible sidebar (`w-60` expanded, `w-20` collapsed) + mobile header with hamburger drawer. Sidebar nav items are defined in `src/app/_navigation/sidebar/constants.tsx`.

| Route | Purpose |
|---|---|
| `/dashboard` | Metrics overview, today's schedule |
| `/bookings` | Booking table + calendar view |
| `/bookings/confirmation` | Post-payment confirmation handler |
| `/services` | Service CRUD + package management |
| `/service-categories` | Category management |
| `/staff` | Staff member management |
| `/payments` | Payment records |
| `/reports` | Analytics / reporting |
| `/availability` | Business hours + blocked dates |
| `/promo-codes` | Promo code management |
| `/app-settings` | Style images, walk-in email |

### Customer — `(customer)/`

Publicly accessible (no auth required). Layout renders the public header and footer.

| Route | Purpose |
|---|---|
| `/home` | Landing page — hero, service carousel, CTA |
| `/customer/services` | Full service browsing grid |
| `/customer/booking` | Multi-step booking wizard |
| `/customer/booking/reschedule/[id]` | Self-service reschedule |
| `/customer/booking/summary/[id]` | Post-booking summary |

### Auth Pages (no route group)

`/login`, `/forgot-password`, `/reset-password/[tokenId]` — minimal shell, no sidebar.

---

## 4. Authentication & Session Management

No third-party auth library. Session management is implemented from scratch using `@oslojs/crypto`.

### Session Lifecycle

```
POST /api/login
  → bcrypt.compare(password, user.passwordHash)
  → generateSessionToken()         // 20 random bytes → base32 string
  → encodeHexLowerCase(sha256(token))  // only the hash is stored
  → prisma.session.create({ id: hash, userId, expiresAt: now + 30d })
  → Set-Cookie: session=<raw-token>; HttpOnly; SameSite=lax; Path=/; [Secure]
```

```
Every authenticated request
  → cookies().get("session")
  → sha256(rawToken) → look up Session row (include: { user: true })
  → if expired → delete session, return null
  → if within 15d of expiry → extend by 30d (sliding expiry)
  → return { session, user }
```

The validation function is wrapped in React `cache()` so it executes at most once per server request regardless of how many guards call it.

### Auth Guards

Four guard functions in `src/app/_auth/`:

| Function | Location | Returns on failure |
|---|---|---|
| `requireAuth()` | Server Components | `redirect('/login')` |
| `requireAuthApi()` | API Routes | `NextResponse 401` |
| `requireRole(roles)` | Server Components | `redirect('/unauthorized')` |
| `requireRoleApi(roles)` | API Routes | `NextResponse 403` |

There is **no `middleware.ts`**. Guards are called inline at the top of each page/route that needs protection. This is intentional — it keeps auth logic co-located with the resource it protects and avoids Edge runtime constraints.

### Role System

Three roles via the `UserRole` enum: `ADMIN`, `STAFF`, `CUSTOMER`. Stored on `User.role`. New accounts created by admin default to `STAFF` role. Admin panels require `ADMIN`. Most customer-facing API routes are unauthenticated (booking is open to the public).

### Client-Side Auth

The Axios `api` instance in `src/lib/api.ts` intercepts HTTP responses:
- `401` → `window.location.href = '/login'`
- `403` → `window.location.href = '/unauthorized'`

### Password Reset Flow

```
POST /api/forgot-password
  → inngest.send("app/password.password-reset", { userId })
  → [async] passwordResetEvent Inngest function:
      → generate PasswordResetToken (hash stored, raw in URL)
      → Resend email with reset link → /reset-password/[tokenId]

POST /api/reset-password/[tokenId]
  → sha256(tokenId) → lookup token, check expiry
  → bcrypt.hash(newPassword) → update User.passwordHash
  → prisma.passwordResetToken.delete()
```

---

## 5. Database & Data Model

**Database:** PostgreSQL 15. Connected via `@prisma/adapter-pg` using the `DIRECT_URL` env var. Schema is applied at container startup with `prisma db push` (no migration files used in production — schema-first, `--accept-data-loss`).

**Prisma client** is generated at `generated/prisma/` (custom output path in `schema.prisma`). A singleton instance is created in `src/lib/prisma.ts` and reused across all server code.

### Entity Relationship Overview

```
User ──< Session
User ──< PasswordResetToken
User ──< Booking (createdBy)
User ──< Booking (assignedTo)  ← staff assignment

ServiceCategory ──< Service
Service ──< BookingService
Service ──< PackageService

ServicePackage ──< PackageService
ServicePackage ──< Booking

Booking ──< BookingService     ← price/duration snapshot at booking time
Booking ──< Payment
Booking ──< Invoice
Booking ──< PaymentAuditLog
Booking >── PromoCode

Invoice ──< Invoice (parent/child for refunds)
Invoice ──< PaymentAuditLog

BusinessHour (unique per dayOfWeek 0-6)
BlockedDate (unique per date)
StyleImage
SystemSetting (key-value config store)
```

### Models

#### Core Booking Models

**`Booking`**
The central entity. Key fields:
- `bookingReference` — unique human-readable reference (e.g. `POL-123456`)
- `bookingDate` — stored as `String` `"YYYY-MM-DD"` (not `DateTime`) to avoid timezone issues
- `bookingTime` — stored as `String` `"HH:mm"`
- `status` — `PENDING | CONFIRMED | CANCELLED | COMPLETED`
- `paymentStatus` — `PENDING | PARTIAL | PAID` (computed and cached, recalculated by `refreshBookingPaymentStatus`)
- `bookingType` — `SCHEDULED | WALKIN`
- `assignedToId` — nullable FK to `User` (staff assignment, named relation `"BookingAssignedTo"`)
- `createdById` — nullable FK to `User` (admin who created it)
- `googleEventId` — Google Calendar event ID, set after confirmation

**`BookingService`** — join table between `Booking` and `Service`.
Snapshots `priceAtBooking` and `durationAtBooking` at the moment of booking. This means service price changes do not retroactively affect existing bookings.

#### Payment Models

**`Payment`** — raw payment record from a gateway or manual entry.
- `provider` — `PRIMARY_PAYSTACK | SECONDARY_PAYSTACK | MANUAL`
- `providerRef` — gateway transaction reference
- `status` — `PENDING | PAID | PARTIAL | REFUNDED | FAILED`
- `rawPayload` — full JSON from gateway (for audit/debugging)

**`Invoice`** — the commercial record sent to/tracked for the customer.
- `transactionType` — `"initial" | "top_up" | "refund"`
- `parentInvoiceId` — self-relation for refund invoices linked to their original
- `gateway` — which Paystack gateway handled it

**`PaymentAuditLog`** — append-only log of every payment lifecycle event. `action` values include `WEBHOOK_RECEIVED`, `PAYMENT_INITIALIZED`, `PAYMENT_INITIALIZATION_ATTEMPT_FAILED`, `GATEWAY_FAILOVER`, `REFUND_INITIATED`.

#### Configuration Models

**`BusinessHour`** — one row per day of week (0=Sunday…6=Saturday).
- `maxConcurrentBookings` — slot availability cap per time point

**`BlockedDate`** — dates the salon is closed. Can optionally specify `startTime`/`endTime` for partial-day blocks.

**`SystemSetting`** — generic key/value store for runtime-configurable settings:
- `walkin_email` — fallback email for walk-in bookings
- `PRIMARY_PAYSTACK_ROUTING_THRESHOLD` — gateway routing % threshold

### Canonical Booking Include

A single `bookingInclude` constant in `src/lib/prisma-includes.ts` defines the standard `include` shape for all booking queries:

```typescript
export const bookingInclude = {
  services: { include: { service: true } },
  payments: true,
  assignedTo: { select: { id: true, username: true, phone: true } },
} satisfies Prisma.BookingInclude

export type BookingFull = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>
```

Every query that returns a booking uses this constant. The `satisfies` keyword enforces compile-time validation. `BookingFull` is the single source of truth for the TypeScript booking type — `BookingWithService` and `BookingWithServiceAndPayment` in `features/booking/types.ts` are aliases of it.

### Slot Availability Algorithm

`bookingRepository.isSlotAvailable(date, time, durationMinutes, excludeBookingId, serviceIds)`:

1. Fetch `BusinessHour.maxConcurrentBookings` for the day.
2. Convert requested time to minutes. Collect all existing bookings for that date (PENDING + CONFIRMED, excluding the booking being rescheduled).
3. **Global capacity check**: For every time checkpoint in the requested window, count how many existing bookings overlap. If any checkpoint reaches `maxConcurrentBookings` → unavailable.
4. **Per-category capacity check**: For each `ServiceCategory` touched by the requested services, repeat the overlap check against `category.capacity`. This prevents a category from being over-booked even if global capacity is not reached.

---

## 6. API Layer

All routes live under `src/app/api/`. Every route handler follows this contract:

```typescript
// Success
NextResponse.json({ success: true, message: "...", data: T })

// Failure
NextResponse.json({ success: false, message: "..." }, { status: 4xx | 5xx })
```

Error responses match the `ApiError` interface in `src/types/api.ts`:
```typescript
interface ApiError { message: string; error?: string; statusCode?: number }
```

### Route Inventory

#### Auth
| Route | Methods | Auth required |
|---|---|---|
| `/api/login` | POST | — |
| `/api/logout` | POST | — |
| `/api/forgot-password` | POST | — |
| `/api/reset-password/[tokenId]` | POST | — |

#### Bookings
| Route | Methods | Auth required |
|---|---|---|
| `/api/bookings` | GET, POST | ADMIN (GET + walk-in POST) |
| `/api/bookings/[id]` | GET, DELETE | ADMIN |
| `/api/bookings/[id]/cancel` | POST | — |
| `/api/bookings/[id]/charge` | POST | ADMIN |
| `/api/bookings/[id]/top-up` | POST | ADMIN |
| `/api/bookings/[id]/mark-as-paid` | POST | ADMIN |
| `/api/bookings/[id]/reschedule` | POST | — |
| `/api/bookings/[id]/status` | POST | — |
| `/api/bookings/[id]/assign` | PATCH | ADMIN |
| `/api/bookings/availability` | GET | — |

#### Payments & Paystack
| Route | Methods | Auth required |
|---|---|---|
| `/api/payments` | GET, POST | — |
| `/api/payments/initialize` | POST | — |
| `/api/payments/metrics` | GET | — |
| `/api/payments/gateway-metrics` | GET | ADMIN |
| `/api/paystack/verify/[reference]` | GET | — |
| `/api/paystack-primary/webhook` | POST | Paystack HMAC-SHA512 |
| `/api/paystack-secondary/webhook` | POST | Paystack HMAC-SHA512 |

#### Services & Catalogue
| Route | Methods | Notes |
|---|---|---|
| `/api/services` | GET, POST | GET is public (no auth) |
| `/api/services/[id]` | GET, PUT, DELETE | |
| `/api/services/[id]/status` | PATCH | Toggle isActive |
| `/api/service-categories` | GET, POST | GET is public |
| `/api/service-categories/[id]` | PATCH, DELETE | |
| `/api/packages` | GET, POST | |
| `/api/packages/[id]` | GET, PATCH, DELETE | |
| `/api/promo-codes` | GET, POST | |
| `/api/promo-codes/[id]` | PATCH, DELETE | |
| `/api/promo-codes/validate` | POST | Public — customer pre-check |

#### Configuration & Admin
| Route | Methods | Auth required |
|---|---|---|
| `/api/staff` | GET, POST | ADMIN |
| `/api/business-hours` | GET | — |
| `/api/business-hours/[dayOfWeek]` | PATCH | — |
| `/api/business-hours/[dayOfWeek]/status` | PATCH | — |
| `/api/blocked-dates` | GET, POST | — |
| `/api/blocked-dates/[date]` | DELETE | — |
| `/api/settings/walkin-email` | GET, PATCH | ADMIN |
| `/api/style-images` | GET, POST, PATCH, DELETE | — |
| `/api/upload` | POST | — |
| `/api/upload/presign` | POST | — |
| `/api/inngest` | GET, POST, PUT | Inngest signing key |

### Data Flow (Example: Customer Books a Service)

```
1. CustomerBookingForm validates with react-hook-form + Zod
2. useCreateBooking() fires useMutation → api.post("/api/bookings", payload)
3. POST /api/bookings/route.ts
   a. BookingSchema.parse(body)             // Zod validation
   b. blockedDateRepository.findByDate()    // date not blocked?
   c. businessHourRepository.findByDayOfWeek() // salon open?
   d. bookingRepository.isSlotAvailable()  // no overlap?
   e. promoCode validation + usedCount increment
   f. bookingRepository.upsertBooking()    // prisma.booking.create(...)
   g. inngest.send("app/booking.booking-created")
   ← { success: true, data: booking }
4. queryClient.invalidateQueries(["slots", ...], ["bookings", ...])
5. toast.success("Booking created")
```

---

## 7. Feature Module Pattern

Every domain capability lives in `src/features/<name>/` and follows a strict layer structure:

```
features/<name>/
├── server/
│   ├── <name>.repository.ts    # Pure Prisma queries — no business logic
│   └── <name>.service.ts       # Orchestration, cross-repo calls, side effects
├── client/
│   └── use-<name>.ts           # TanStack Query hooks (useQuery / useMutation)
├── components/
│   ├── <name>-shell.tsx        # Client-side page container
│   └── form/                   # Form components (react-hook-form + Zod)
├── events/
│   └── event-<name>.ts         # Inngest function definitions
├── emails/
│   └── send-<email>.ts         # Resend send helpers (wraps React Email templates)
├── types.ts                    # Public TypeScript interfaces
└── utils/
    ├── validation.ts           # Zod schemas; export both z.infer<> and z.input<> types
    └── helpers.ts              # Pure utility functions
```

**Key rule:** `server/` files may only be imported in Server Components and API routes. `client/` files are `"use client"`. This boundary is enforced by Next.js but should also be respected manually.

**Repository vs Service:**
- **Repository** — one class per entity, wraps Prisma. No business logic. Called directly from API routes for simple CRUD.
- **Service** — orchestrates multiple repositories, handles transactions, calls external services (Inngest, Google Calendar, Resend). Used for complex operations like payment processing.

---

## 8. Client-Side State Management

**TanStack Query v5** is the sole data-fetching and server-state layer. There is no Redux, Zustand, or React Context for server data.

### Setup

`ReactQueryProvider` in `src/lib/react-query.tsx` wraps the root layout. It creates a browser singleton `QueryClient` (`staleTime: 60_000ms`) and a fresh instance per server render.

### Patterns

```typescript
// Read (useQuery)
export function useGetBookings(filters) {
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: () => api.get("/bookings", { params: filters }).then(r => r.data.data),
  })
}

// Write (useMutation)
export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post("/bookings", payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["slots"] })
      toast.success("Booking created")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Something went wrong")
    },
  })
}
```

### Query Key Conventions

| Resource | Key pattern |
|---|---|
| All bookings | `["bookings"]` or `["reports-bookings", ...filters]` |
| Single booking | `["booking", id]` |
| Available slots | `["slots", date, serviceIds]` |
| Services | `["services"]` |
| Categories | `["service-categories"]` |
| Staff | `["staff"]` |
| Metrics | `["booking-metrics"]` |

### HTTP Client

`src/lib/api.ts` exports two Axios instances:
- `api` — authenticated, with 401/403 interceptors that redirect to login/unauthorized
- `publicApi` — no interceptors, used for public endpoints (customer booking, reschedule)

Both use `baseURL: "/api"` and `withCredentials: true`.

### Error Typing

`isAxiosError(err)` in `src/lib/utils.ts` narrows errors to `AxiosError<ApiError>` so `.response?.data?.message` is always `string | undefined`.

---

## 9. Payment System

The most complex subsystem. Polaris operates with **two Paystack gateways** (primary and secondary) with automatic routing, failover, and idempotent webhook handling.

### Services Involved

| Service | Location | Responsibility |
|---|---|---|
| `PaymentProcessingService` | `features/payment/server/payment-processing.service.ts` | Entry point for all payment initiation; orchestrates gateway selection, invoice creation, and retry |
| `SubsequentPaymentService` | `features/payment/server/subsequent-payment.service.ts` | Top-ups (remaining balance) and refunds |
| `GatewaySelectionService` | `features/payment/server/gateway-selection.service.ts` | Chooses PRIMARY or SECONDARY per request |
| `GatewayMetricsService` | `features/payment/server/gateway-metrics.service.ts` | Reads/writes routing threshold from `SystemSetting` |
| `PaymentAllocationService` | `features/payment/server/payment-allocation.service.ts` | Calculates today's % split between gateways |
| `PaymentService` | `features/payment/server/payment.service.ts` | Processes confirmed webhook events idempotently |
| `InvoiceService` | `features/invoice/server/invoice.service.ts` | Invoice lifecycle management |
| `AuditLogService` | `features/payment/server/audit-log.service.ts` | Append-only `PaymentAuditLog` writes |

### Full Payment Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│  1. Admin initiates charge                                       │
│     POST /api/bookings/[id]/charge                               │
│                                                                  │
│  2. PaymentProcessingService.initializePayment()                 │
│     a. GatewaySelectionService.selectGateway()                   │
│        → PaymentAllocationService.calculateDailyAllocation()     │
│        → Reads today's paid invoices → calculates PRIMARY %      │
│        → Compares to SystemSetting(PRIMARY_PAYSTACK_ROUTING_     │
│          THRESHOLD, default 40%)                                 │
│        → Routes to gateway below its threshold                   │
│     b. InvoiceService.createInvoice() → Invoice (DRAFT→PENDING)  │
│     c. initializeWithResilience()                                │
│        → Try selected gateway (3 attempts: 0s, 2s, 5s)          │
│        → On failure: failover to alternate gateway (1 attempt)   │
│        → AuditLog: GATEWAY_FAILOVER / PAYMENT_INITIALIZED        │
│     d. Return { paymentUrl, gateway, invoiceNumber }             │
│                                                                  │
│  3. Customer completes payment on Paystack hosted checkout       │
│                                                                  │
│  4. Paystack → POST /api/paystack-primary/webhook                │
│     a. verifyPaystackSignature() (HMAC-SHA512)                   │
│     b. event === "charge.success"                                │
│     c. AuditLog: WEBHOOK_RECEIVED                                │
│     d. PaymentService.confirmInvoicePayment(invoiceId, ref, data)│
│        i.   Invoice → PAID                                       │
│        ii.  prisma.payment.create() (status: PAID)              │
│        iii. refreshBookingPaymentStatus() → recalc PAID/PARTIAL  │
│        iv.  booking.status → CONFIRMED                           │
│        v.   Google Calendar event created → googleEventId saved  │
│        vi.  inngest.send("app/payment.payment-received")         │
│             → admin email + customer SMS                         │
└──────────────────────────────────────────────────────────────────┘
```

### Idempotency

`PaymentService.processSuccessfulPayment()` and `confirmInvoicePayment()` check the current payment/booking status before writing. If already `PAID` or `CONFIRMED`, they skip updates silently. Paystack may deliver webhooks more than once — this prevents double-processing.

### Manual Payment

`POST /api/bookings/[id]/mark-as-paid` (ADMIN only):
- Creates a `Payment` record with `provider = MANUAL`
- Calls `refreshBookingPaymentStatus()`
- Sets booking to `CONFIRMED`
- Creates Google Calendar event
- Fires `app/payment.payment-received` Inngest event

### Top-Up (Remaining Balance)

`POST /api/bookings/[id]/top-up` → `SubsequentPaymentService.processTopUp()`:
- Finds the original invoice to identify which gateway was used
- Passes `forcedGateway` to `PaymentProcessingService.initializePayment()`, bypassing gateway selection

### Refund

`POST /api/bookings/[id]/cancel`:
- Booking status → `CANCELLED`
- For each `PAID` Paystack payment: `PaystackRefundAPI.initiateRefund()`
- Creates a negative `Invoice` with `transactionType = "refund"`
- On `refund.processed` webhook: `Payment.status` → `REFUNDED`, `refreshBookingPaymentStatus()`

### Gateway Routing Logic

```
Daily allocation:
  primaryCount = paid invoices today with gateway = PRIMARY_PAYSTACK
  totalCount = all paid invoices today
  primaryPct = (primaryCount / totalCount) * 100

Routing decision:
  if primaryPct < threshold (default 40%) → use PRIMARY
  else if secondaryPct < (100 - threshold) → use SECONDARY
  else → PRIMARY (default)

First booking of day always → SECONDARY
```

The threshold is stored in `SystemSetting` and editable at runtime.

---

## 10. Background Jobs — Inngest

Inngest provides durable, retryable background functions. The server endpoint is at `/api/inngest`.

In development: `inngest-cli dev` runs alongside Next.js via `concurrently` in `npm run dev`.
In production: Inngest cloud polls the `/api/inngest` endpoint.

### Registered Functions

#### `booking-created`
- **Trigger:** `app/booking.booking-created`
- **Emitted from:** `POST /api/bookings`
- **Steps:** Stub (reserved for future notification logic at booking creation time)

#### `booking-cancel`
- **Trigger:** `app/booking.booking-cancel`
- **Emitted from:** `POST /api/bookings/[id]/cancel`
- **Steps:**
  1. Fetch booking with services and payments
  2. Render and send cancellation email via Resend
  3. Send cancellation SMS via Arkesel

#### `payment-received-admin-notify`
- **Trigger:** `app/payment.payment-received`
- **Emitted from:** Paystack webhooks + `mark-as-paid` endpoint
- **Steps:**
  1. Fetch booking
  2. Fetch all users with `role = ADMIN`
  3. Email every admin (via Resend) with booking + payment details
  4. Send booking confirmation SMS to customer (via Arkesel) with summary link

#### `password-reset`
- **Trigger:** `app/password.password-reset`
- **Emitted from:** `POST /api/forgot-password`
- **Steps:**
  1. Fetch user by ID
  2. Generate `PasswordResetToken` (store SHA-256 hash; raw token in URL)
  3. Send password reset email via Resend

### Event Type Safety

All event schemas are typed in `src/lib/inngest.ts` via `EventSchemas.fromRecord<Events>()`. Calling `inngest.send(...)` with a mistyped payload is a compile-time error.

---

## 11. External Services

### Paystack (Dual Gateway)

Two independent Paystack accounts, both managed in `src/lib/paystack.ts`.

| Variable | Account |
|---|---|
| `PRIMARY_PAYSTACK_SECRET_KEY` | Primary gateway |
| `SECONDARY_PAYSTACK_SECRET_KEY` | Secondary / failover gateway |

The `initializeTransaction`, `verifyTransaction`, and `initiateRefund` functions accept a `provider` parameter that selects which secret key to use.

Webhook signatures are verified using HMAC-SHA512 of the raw request body against `x-paystack-signature`.

### Google Calendar

`src/lib/google-calendar.ts` authenticates via a **Google Service Account JWT** (`GOOGLE_SERVICES_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`). On booking confirmation, `createCalendarEvent(booking)` creates a calendar event on the calendar specified by `GOOGLE_CALENDAR_ID`, with the booking reference, client name, services, and duration as the event body.

### Resend

`src/lib/resend.ts` exports a `Resend` client. Emails are composed using **React Email** templates in `src/emails/` and rendered to HTML via `@react-email/render` before being sent.

Templates:
- `BookingCancelledEmail` — sent to client on cancellation
- `PaymentLinkEmail` — payment link for customer (if needed)
- `PaymentReceivedEmail` — admin notification on payment
- `EmailPasswordResetEmail` — password reset link

### Arkesel (SMS)

`src/lib/arkesal.ts` sends SMS via the Arkesel HTTP API (`ARKESEL_API_KEY`). Phone numbers are automatically formatted: local `024...` → international `2334...` format for Ghana. Used for booking confirmation and cancellation SMS to customers.

### Inngest

`src/lib/inngest.ts` creates the `Inngest` client with the app ID `"polaris-beauty"`. The signing key (`INNGEST_SIGNING_KEY`) and event key (`INNGEST_EVENT_KEY`) authenticate communication with the Inngest cloud. `INNGEST_DEV` toggles local dev mode.

---

## 12. File Storage — MinIO

`src/lib/minio.ts` creates a MinIO client pointed at the internal Docker service (`MINIO_ENDPOINT`, `MINIO_PORT`). Bucket: `polaris-services`. Policy: public-read.

### Upload Flow

```
Admin uploads image →
  POST /api/upload/presign
    → minioClient.presignedPutObject(bucket, objectName, 600s)
    → Rewrites internal host to public URL (polarisbeautylounge.com/files)
    ← { presignedUrl, publicUrl }
  
  Browser → PUT presignedUrl (directly to MinIO via Caddy proxy)
  
  On success → PATCH /api/services/[id] with { imageUrl: publicUrl }
```

The presigned URL is generated against the internal Docker endpoint, then the host is rewritten to the public domain before being returned to the browser. Caddy reverse-proxies `/files/*` back to MinIO, so the AWS Sig V4 `Host` header remains valid.

### Legacy URL Rewrite

`ServiceRepository.getAllServices()` silently rewrites image URLs containing the old domain `polarisbeauty.biz` to the current domain `polarisbeautylounge.com`, maintaining backward compatibility after a domain migration without a database update.

---

## 13. Email & SMS Notifications

### Trigger Map

| Event | Email | SMS |
|---|---|---|
| Booking confirmed (payment received) | Admin notified | Customer confirmation SMS with summary link |
| Booking cancelled | Customer cancellation email | Customer cancellation SMS |
| Password reset requested | User reset link email | — |

### Email Templates

Located in `src/emails/`. Built with React Email (`@react-email/components`, `@react-email/render`). Rendered server-side to HTML strings before being passed to Resend.

### SMS

Arkesel delivers to Ghanaian mobile numbers. Number formatting is handled in `lib/arkesal.ts`. SMS content includes: client name, booking reference, date/time, services, and a summary link.

---

## 14. Deployment Architecture

### Docker Multi-Stage Build

`Dockerfile.prod` has three stages:

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | Full `npm ci` (all deps + postinstall → `prisma generate`) |
| `builder` | `node:20-alpine` | Next.js build → `.next/standalone/` |
| `runner` | `node:20-alpine` | Minimal runtime image |

The `runner` stage copies only:
- `.next/standalone/` — standalone Next.js server with tree-shaken `node_modules`
- `.next/static/` — static assets
- `public/` — public files
- `prisma/schema.prisma` — for db push at startup
- `generated/` — Prisma generated client

Prisma CLI and `tsx` are installed globally (`npm install -g prisma tsx`) in the runner, separate from the standalone's node_modules.

### Container Startup

`docker-entrypoint.sh`:
```sh
prisma db push --accept-data-loss --schema=./prisma/schema.prisma --url="$DATABASE_URL"
exec node server.js
```

On every container start, schema is synced to the database before the server launches. This replaces traditional migrations.

### docker-compose Services

| Service | Image | Role |
|---|---|---|
| `app` | `polaris-main:latest-polaris-main` | Next.js application |
| `db` | `postgres:15-alpine` | Primary database |
| `minio` | `minio/minio:latest` | File storage |
| `nginx` | `nginx:alpine` | TLS termination, reverse proxy |
| `certbot` | `certbot/certbot` | Let's Encrypt certificate auto-renewal |

All services share `polaris_network` (bridge). The app container never exposes port 3000 publicly — only Nginx does, on 80/443.

### CI/CD

Deployments are managed via **Komodo**:
1. Komodo pulls from the `main` branch on GitHub
2. Builds the Docker image using `docker-compose.yml` + `Dockerfile.prod`
3. Pushes the built image to the Portainer host
4. Portainer redeploys the stack

Build args (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MINIO_ENDPOINT`, `NEXT_PUBLIC_MINIO_PORT`) are baked into the client bundle at compile time. All other secrets are injected at runtime via Portainer environment variables.

---

## 15. Key Architectural Decisions

### No middleware.ts for auth
Auth guards are called inline in each route/page rather than in a single `middleware.ts`. This avoids Edge runtime constraints (Prisma does not run on the Edge), keeps auth logic co-located with the protected resource, and makes it easier to apply different auth requirements per route.

### bookingDate stored as String, not DateTime
`Booking.bookingDate` is `String "YYYY-MM-DD"` rather than a Prisma `DateTime`. This eliminates timezone conversion issues — the date a customer books is the date they see, regardless of the server's timezone or UTC offset.

### bookingInclude as single source of truth
Rather than re-declaring `include: { services: ..., payments: ..., assignedTo: ... }` in every query, a single `bookingInclude` constant is defined in `src/lib/prisma-includes.ts`. `BookingFull` is derived from it using `Prisma.BookingGetPayload`. This eliminates an entire class of TypeScript shape-mismatch errors that would otherwise appear when adding new relations.

### Dual Paystack gateways with dynamic routing
Rather than a single payment processor, Polaris routes payments between two independent Paystack accounts based on daily volume percentages. This provides resilience against gateway downtime, helps with transaction limits, and allows routing thresholds to be adjusted at runtime via `SystemSetting` without a deployment.

### prisma db push over migrations in production
The app uses `prisma db push --accept-data-loss` at container startup instead of `prisma migrate deploy`. This trades migration history and rollback safety for simplicity and zero-downtime schema sync. Acceptable for a single-tenant deployment where the schema owner controls all deployments.

### Inngest for background jobs over BullMQ/raw queues
Inngest provides step functions with automatic retries, event replay, and a development UI out of the box. There is no Redis dependency. Functions are defined in TypeScript alongside application code and are triggered by typed events.

### z.input<> vs z.infer<> for form types
Zod v4's `z.infer<>` returns the output type (after transforms/defaults). When used with `useForm<T>` and `zodResolver`, this causes a TypeScript mismatch because the resolver types against the input type (before defaults are applied). All form types use `z.input<typeof Schema>` to match the resolver's expectation.

### No Next.js middleware for auth — guards are inline
Each page and API route calls its guard (`requireRole`, `requireRoleApi`) as the first line. This is verbose but explicit, avoids the `middleware.ts` matcher complexity, and runs on Node.js runtime where Prisma is available.

---

*Last updated: automatically generated from codebase audit.*
