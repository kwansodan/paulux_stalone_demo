# Polaris — Application Architecture

This document describes the technical architecture of the Polaris Beauty Lounge booking platform. It covers the directory structure, data model, API design, authentication, payment system, inventory, gift cards, background jobs, deployment, and the key decisions behind each.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Directory Structure](#2-directory-structure)
3. [Route Groups & Page Layout](#3-route-groups--page-layout)
4. [Authentication, Roles & Permissions](#4-authentication-roles--permissions)
5. [Database & Data Model](#5-database--data-model)
6. [API Layer](#6-api-layer)
7. [Feature Module Pattern](#7-feature-module-pattern)
8. [Client-Side State Management](#8-client-side-state-management)
9. [Payment System](#9-payment-system)
10. [Gift Card System](#10-gift-card-system)
11. [Inventory — Products & Materials](#11-inventory--products--materials)
12. [Background Jobs — Inngest](#12-background-jobs--inngest)
13. [External Services](#13-external-services)
14. [File Storage — MinIO](#14-file-storage--minio)
15. [Email & SMS Notifications](#15-email--sms-notifications)
16. [Rate Limiting](#16-rate-limiting)
17. [SEO & FAQ Content](#17-seo--faq-content)
18. [Deployment Architecture](#18-deployment-architecture)
19. [Key Architectural Decisions](#19-key-architectural-decisions)

---

## 1. System Overview

Polaris is a **full-stack Next.js 16 application** that combines a customer-facing salon booking flow with an admin management dashboard. It is a monorepo: one Next.js app serves both the public-facing website and the internal admin panel.

Beyond booking and payments, the app also runs the salon's **retail product catalogue with stock tracking**, **internal materials/consumables costing** (per business "section" — Nails, Barber, Hair, …), a **stored-value gift card** program, and a **role-based permission system** for staff accounts.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│   Customer Flow (/customer/*, /gift-cards, /faq)  Admin (/(admin)/*) │
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
| Auth | Custom cookie-based sessions (`@oslojs/crypto`) + role/permission gating |
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
│   ├── create-admin.ts         # Standalone bootstrap: create first admin user
│   ├── import-services.ts      # Standalone bulk-import of services-import-data.json
│   ├── remove-imported-services.ts  # Reverses import-services.ts
│   └── services-import-data.json    # Source data for the bulk import scripts
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
│   │   ├── faq/                # Static FAQ content (no DB model)
│   │   ├── feedback/           # Google review link setting + feedback-request email
│   │   ├── gift-card/          # Stored-value gift cards
│   │   ├── invoice/
│   │   ├── material/           # Internal consumables + section cost tracking
│   │   ├── package/
│   │   ├── payment/
│   │   ├── product/             # Retail products + optional stock tracking
│   │   ├── product-category/
│   │   ├── promo-code/
│   │   ├── roles/               # Custom roles + permission assignment (staff)
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
│   │   ├── permissions.ts      # PermissionKey registry — single source of truth for RBAC
│   │   ├── prisma.ts           # PrismaClient singleton
│   │   ├── prisma-includes.ts  # bookingInclude + BookingFull type
│   │   ├── rate-limit.ts       # In-memory per-process fixed-window rate limiter
│   │   ├── react-query.tsx     # QueryClientProvider
│   │   ├── resend.ts           # Resend email client
│   │   └── site-config.ts      # NAP / SEO source of truth (name, address, hours, JSON-LD inputs)
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

Protected by `requireRole([UserRole.ADMIN], permissionKey)` called at the top of every Server Component page — `ADMIN`/`SUPER_ADMIN` always pass; `STAFF` users pass only if their assigned custom `Role` includes the given permission (see §4). Unauthenticated → redirect `/login`. No matching role/permission → redirect `/unauthorized`.

**Layout:** Collapsible sidebar (`w-60` expanded, `w-20` collapsed) + mobile header with hamburger drawer. Sidebar nav items are defined in `src/app/_navigation/sidebar/constants.tsx`, each tagged with the `PermissionKey` required to show it — staff without the permission simply don't see the nav item.

| Route | Purpose | Permission |
|---|---|---|
| `/dashboard` | Metrics overview, today's schedule | `dashboard.view` |
| `/bookings` | Booking table + calendar view | `bookings.view` |
| `/bookings/confirmation` | Post-payment confirmation handler | — |
| `/payments` | Payment records | `payments.view` |
| `/services` | Service + package CRUD (also hosts service-category management inline) | `services.view` |
| `/products` | Retail product catalogue + stock management | `products.view` |
| `/materials` | Materials/consumables inventory | `materials.view` |
| `/materials/usage` | Section cost usage report | `materials.view` |
| `/reports` | Booking metrics + material cost-by-section summary | `reports.view` |
| `/promo-codes` | Promo code management | `promo_codes.view` |
| `/gift-card-orders` | Gift card order list, status, cancellation | `gift_cards.view` |
| `/app-settings` | Consolidated settings: style images, business hours, blocked dates, walk-in email, payment recipient emails, global min deposit, Google review link, service categories, **staff accounts**, **roles & permissions** | `settings.view` |

> Note: staff management, business hours/blocked dates, and roles & permissions do **not** have their own top-level routes — they are tabs/sections inside the single `/app-settings` page (`AppSettingsShell`), fetched together in one Server Component.

### Customer — `(customer)/`

Publicly accessible (no auth required). Layout renders the public header and footer.

| Route | Purpose |
|---|---|
| `/home` | Landing page — hero, service carousel, CTA |
| `/customer/services` , `/services`, `/services/[slug]` | Service browsing (grid + individual SEO-friendly detail pages) |
| `/customer/booking` | Multi-step booking wizard (accepts `?serviceId=`, `?packageId=`, `?giftCard=`) |
| `/customer/booking/reschedule/[id]` | Self-service reschedule |
| `/customer/booking/summary/[id]` | Post-booking summary |
| `/gift-cards` | Gift card purchase builder (`GiftCardBuilder`) |
| `/gift-cards/success` | Post-purchase confirmation (after Paystack redirect) |
| `/faq` | Static FAQ page + `FAQPage` JSON-LD for AI answer engines |

### Auth Pages (no route group)

`/login`, `/forgot-password`, `/reset-password/[tokenId]` — minimal shell, no sidebar.

---

## 4. Authentication, Roles & Permissions

No third-party auth library. Session management is implemented from scratch using `@oslojs/crypto`. On top of sessions, a **permission-based RBAC layer** controls what STAFF accounts can see and do.

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

### Role System

`UserRole` enum has four values: `ADMIN`, `STAFF`, `CUSTOMER`, `SUPER_ADMIN`. Stored on `User.role`. `ADMIN` and `SUPER_ADMIN` bypass all permission checks and can access every admin page. `CUSTOMER` is unused for admin auth (booking is open to the public and doesn't require an account).

**`STAFF` accounts are gated by permissions, not by role alone.** Each `User` may have a `customRoleId` pointing at a `Role` row:

```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  description String?
  permissions String[]     // array of PermissionKey strings, e.g. ["bookings.view", "payments.view"]
  isSystem    Boolean  @default(false)  // system roles can't be deleted from the UI
  users       User[]
  ...
}
```

Roles are managed at `/app-settings` → Roles tab (`RolesShell` / `PermissionGrid`), which renders every `PermissionKey` grouped by area (Core, Catalog, Analytics, Marketing, Administration — defined in `src/lib/permissions.ts`) as a checkbox grid, with per-area "select all" and a "partial" indicator.

### Auth Guards

Four guard functions in `src/app/_auth/`, all accepting an **optional `permission` argument**:

| Function | Location | Signature | Returns on failure |
|---|---|---|---|
| `requireAuth()` | Server Components | `()` | `redirect('/login')` |
| `requireAuthApi()` | API Routes | `()` | `NextResponse 401` |
| `requireRole(roles, permission?)` | Server Components | `(UserRole[], PermissionKey?)` | `redirect('/unauthorized')` |
| `requireRoleApi(roles, permission?)` | API Routes | `(UserRole[], PermissionKey?)` | `NextResponse 403` |

Resolution order inside `requireRole` / `requireRoleApi`:
1. `SUPER_ADMIN` or `ADMIN` → always allowed.
2. `STAFF` **with** a `permission` argument → allowed only if `user.customRole.permissions` includes that key.
3. No `permission` argument (legacy call sites) → falls back to a plain `allowedRoles.includes(user.role)` check.

This means every admin page/route can be locked down per-permission without touching the guard itself — call sites just pass the relevant `PermissionKey` from `src/lib/permissions.ts`.

### Client-Side Auth

The Axios `api` instance in `src/lib/api.ts` intercepts HTTP responses:
- `401` → `window.location.href = '/login'`
- `403` → `window.location.href = '/unauthorized'`

The sidebar (`src/app/_navigation/sidebar/constants.tsx`) filters `navItems` by the current user's permission set so staff never see links they can't open.

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

Both `/api/login` and `/api/forgot-password` are rate-limited (see §16) to blunt brute-force/enumeration attempts, since they're unauthenticated by design.

---

## 5. Database & Data Model

**Database:** PostgreSQL 15. Connected via `@prisma/adapter-pg` using the `DIRECT_URL` env var. Schema is applied at container startup with `prisma db push` (no migration files used in production — schema-first, `--accept-data-loss`).

**Prisma client** is generated at `generated/prisma/` (custom output path in `schema.prisma`). A singleton instance is created in `src/lib/prisma.ts` and reused across all server code.

### Entity Relationship Overview

```
User ──< Session
User ──< PasswordResetToken
User >── Role (customRole, nullable)      ← permission-based access for STAFF
User ──< Booking (createdBy)
User ──< Booking (assignedTo)             ← staff assignment
User ──< BookingService (assignedTo)      ← per-service stylist assignment
User ──< ProductStockMovement (createdBy)
User ──< MaterialMovement (createdBy)
User ──< GiftCardRedemption (redeemedBy)

ServiceCategory ──< Service
Service ──< BookingService
Service ──< PackageService

ServicePackage ──< PackageService
ServicePackage ──< Booking

ProductCategory ──< Product
Product ──< BookingProduct
Product ──< ProductStockMovement

MaterialCategory ──< Material
Material ──< MaterialMovement
Section ──< MaterialMovement              ← cost centre a material was issued to

Booking ──< BookingService     ← price/duration snapshot at booking time
Booking ──< BookingProduct     ← price snapshot at booking time
Booking ──< Payment
Booking ──< Invoice
Booking ──< PaymentAuditLog
Booking ──< GiftCardRedemption
Booking >── PromoCode
Booking >── ServicePackage

Invoice ──< Invoice (parent/child for refunds)
Invoice ──< PaymentAuditLog

Payment >── ManualPaymentMethod (nullable) ← named cash/POS/gift-card method for manual payments

GiftCard ──< GiftCardItem       ← legacy item snapshot (stored-value cards have none)
GiftCard ──< GiftCardRedemption

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
- `feedbackRequestedAt` — set once a post-visit feedback/review-request email has been sent, so it isn't sent twice
- `products` — retail products sold as part of the booking (see §11)

**`BookingService`** — join table between `Booking` and `Service`.
Snapshots `priceAtBooking` and `durationAtBooking` at the moment of booking. Also carries its own `assignedToId` (relation `"BookingServiceAssignedTo"`) so different services within the same booking can be assigned to different stylists — this is what the `app/booking.stylist-assigned` Inngest event reacts to.

**`BookingProduct`** — join table between `Booking` and `Product`, mirroring `BookingService`'s snapshot pattern (`priceAtBooking`, `quantity`).

#### Payment Models

**`Payment`** — raw payment record from a gateway or manual entry.
- `provider` — `PRIMARY_PAYSTACK | SECONDARY_PAYSTACK | MANUAL`
- `providerRef` — gateway transaction reference
- `status` — `PENDING | PAID | PARTIAL | REFUNDED | FAILED`
- `rawPayload` — full JSON from gateway (for audit/debugging)
- `manualMethodId` — optional FK to `ManualPaymentMethod` when `provider = MANUAL` (e.g. "Cash", "POS", "Gift Card")

**`ManualPaymentMethod`** — admin-configurable list of named manual payment methods (`name`, `isActive`, `sortOrder`), so "mark as paid" isn't limited to a single generic "manual" bucket.

**`Invoice`** — the commercial record sent to/tracked for the customer.
- `transactionType` — `"initial" | "top_up" | "refund"`
- `parentInvoiceId` — self-relation for refund invoices linked to their original
- `gateway` — which Paystack gateway handled it

**`PaymentAuditLog`** — append-only log of every payment lifecycle event. `action` values include `WEBHOOK_RECEIVED`, `PAYMENT_INITIALIZED`, `PAYMENT_INITIALIZATION_ATTEMPT_FAILED`, `GATEWAY_FAILOVER`, `REFUND_INITIATED`.

#### Gift Card Models

See §10 for the full flow. Schema:
- **`GiftCard`** — stored-value card: `code`, sender/recipient contact details, `deliveryMethod` (`SMS | EMAIL | BOTH`), `totalAmount`/`balance`, `status` (`PENDING_PAYMENT → ACTIVE → PARTIALLY_REDEEMED/REDEEMED`, or `EXPIRED`/`CANCELLED`), purchase payment fields (`paymentStatus`, `paymentProvider`, `paymentRef`).
- **`GiftCardItem`** — optional legacy snapshot of specific services/products a card was purchased for (name/price snapshot, not an FK) — current purchases are pure stored-value and create no items.
- **`GiftCardRedemption`** — append-only record of each redemption: `amountApplied`, which `booking` it was applied to, who redeemed it (`redeemedById`).

#### Inventory Models

See §11 for the full flow. Schema:
- **`ProductCategory`** / **`Product`** — retail items sold to customers. `Product.trackStock` toggles whether `stockQuantity`/`lowStockThreshold` are enforced; `ProductStockMovement` (`IN | OUT | ADJUSTMENT`) is the audit trail.
- **`MaterialCategory`** / **`Material`** / **`Section`** / **`MaterialMovement`** — internal consumables (nail polish, hair dye, etc.) issued to a business "section" (cost centre) rather than sold. `MaterialMovement.unitCostAtMovement` snapshots cost so historical reports don't drift when `Material.unitCost` changes later. `StockMovementType` (`IN | OUT | ADJUSTMENT`) is shared between products and materials.

#### Configuration Models

**`BusinessHour`** — one row per day of week (0=Sunday…6=Saturday).
- `maxConcurrentBookings` — slot availability cap per time point

**`BlockedDate`** — dates the salon is closed. Can optionally specify `startTime`/`endTime` for partial-day blocks.

**`SystemSetting`** — generic key/value store for runtime-configurable settings:
- `walkin_email` — fallback email for walk-in bookings
- `PRIMARY_PAYSTACK_ROUTING_THRESHOLD` — gateway routing % threshold
- `PAYMENT_EMAILS_KEY` (see `payment-recipients.ts`) — comma-separated list of admin emails notified on payment
- `GLOBAL_MIN_DEPOSIT_KEY` (see `deposit-settings.ts`) — fallback minimum deposit when a service doesn't set its own
- `GOOGLE_REVIEW_LINK_KEY` (`google_review_link`, see `review-settings.ts`) — link included in post-visit feedback requests

**`Role`** — see §4. Custom, admin-defined permission sets assigned to `STAFF` users.

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
| `/api/login` | POST | — (rate-limited) |
| `/api/logout` | POST | — |
| `/api/forgot-password` | POST | — (rate-limited) |
| `/api/reset-password/[tokenId]` | POST | — |

#### Bookings
| Route | Methods | Auth required |
|---|---|---|
| `/api/bookings` | GET, POST | ADMIN (`bookings.view`) + walk-in POST |
| `/api/bookings/[id]` | GET, DELETE | ADMIN |
| `/api/bookings/[id]/cancel` | POST | — |
| `/api/bookings/[id]/charge` | POST | ADMIN |
| `/api/bookings/[id]/top-up` | POST | ADMIN |
| `/api/bookings/[id]/mark-as-paid` | POST | ADMIN |
| `/api/bookings/[id]/reschedule` | POST | — |
| `/api/bookings/[id]/status` | POST | — |
| `/api/bookings/[id]/assign` | PATCH | ADMIN |
| `/api/bookings/availability` | GET | — |
| `/api/bookings/calendar-counts` | GET | ADMIN — per-day booking counts for the admin calendar view |
| `/api/bookings/lookup-by-phone` | GET | ADMIN — quick customer lookup when creating a walk-in |
| `/api/bookings/search-customers` | GET | ADMIN — autocomplete search across past clients |

#### Payments & Paystack
| Route | Methods | Auth required |
|---|---|---|
| `/api/payments` | GET, POST | — |
| `/api/payments/initialize` | POST | — |
| `/api/payments/metrics` | GET | — |
| `/api/payments/gateway-metrics` | GET | ADMIN |
| `/api/paystack/initialize` | POST | Generic initialize (used outside the booking-charge flow, e.g. gift card top-ups) |
| `/api/paystack/verify/[reference]` | GET | — |
| `/api/paystack-primary/webhook` | POST | Paystack HMAC-SHA512 |
| `/api/paystack-secondary/webhook` | POST | Paystack HMAC-SHA512 |
| `/api/manual-payment-methods` | GET, POST | ADMIN — manage the list of named manual payment methods |
| `/api/manual-payment-methods/[id]` | PATCH, DELETE | ADMIN |

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

#### Products & Materials (Inventory)
| Route | Methods | Auth required |
|---|---|---|
| `/api/products` | GET, POST | ADMIN (`products.view`) — POST upserts (create when no `id`, update when `id` present) |
| `/api/products/[id]` | DELETE | ADMIN |
| `/api/products/stock-tracking` | PATCH | ADMIN — toggle `trackStock` / record a stock movement |
| `/api/product-categories` | GET, POST | ADMIN |
| `/api/product-categories/[id]` | PATCH, DELETE | ADMIN |
| `/api/materials` | GET, POST | ADMIN (`materials.view` / `materials.manage`) — POST upserts |
| `/api/materials/[id]` | DELETE | ADMIN |
| `/api/materials/usage` | GET | ADMIN — section cost usage report (`getUsageBySection`) |
| `/api/sections` | GET, POST | ADMIN — cost-centre management |
| `/api/sections/seed` | POST | ADMIN — seed sections from existing `ServiceCategory` rows |

#### Gift Cards
| Route | Methods | Auth required |
|---|---|---|
| `/api/gift-cards` | GET, POST | GET: ADMIN (`gift_cards.view`); POST: public (customer purchase) |
| `/api/gift-cards/[id]/cancel` | POST | ADMIN |
| `/api/gift-cards/validate` | POST | Public — booking-time balance/eligibility check |
| `/api/gift-cards/redeem` | POST | Public (rate-limited) — apply balance to a booking |
| `/api/gift-cards/verify/[reference]` | GET | Public — post-Paystack-redirect purchase confirmation |

#### Roles & Staff
| Route | Methods | Auth required |
|---|---|---|
| `/api/roles` | GET, POST | ADMIN (`roles.manage`) |
| `/api/roles/[id]` | PUT, DELETE | ADMIN (`roles.manage`) |
| `/api/staff` | GET, POST | ADMIN |
| `/api/staff/[id]` | — | ADMIN |

#### Configuration & Admin
| Route | Methods | Auth required |
|---|---|---|
| `/api/business-hours` | GET | — |
| `/api/business-hours/[dayOfWeek]` | PATCH | — |
| `/api/blocked-dates` | GET, POST | — |
| `/api/blocked-dates/[date]` | DELETE | — |
| `/api/settings/walkin-email` | GET, PATCH | ADMIN |
| `/api/settings/deposit` | GET, PATCH | ADMIN — global minimum deposit fallback |
| `/api/settings/payment-emails` | GET, PATCH | ADMIN — payment notification recipient list |
| `/api/settings/review-link` | GET, PATCH | ADMIN — Google Business review link |
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

**Not every feature needs every layer.** Two examples that deliberately skip most of the structure:
- `features/faq/` — a single `content.ts` file exporting a static Q&A array (fed to both the customer `/faq` page and `FAQPage` JSON-LD). No database model, no server/client layers.
- `features/feedback/` — just `review-settings.ts` (reads/writes the `google_review_link` `SystemSetting`) and an email template. There is no `Feedback` database model; `Booking.feedbackRequestedAt` tracks whether the request email was sent.

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
| Products | `["products"]` |
| Product categories | `["product-categories"]` |
| Materials | `["materials"]`, movements `["materials", id, "movements"]` |
| Gift cards | `["gift-cards"]` |
| Roles | `["roles"]` |

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
| `PaymentService` | `features/payment/server/payment.service.ts` | Processes confirmed webhook events idempotently; `refreshBookingPaymentStatus()` is also called after gift-card redemptions and manual payments |
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
- Creates a `Payment` record with `provider = MANUAL`, optionally tagged with a `manualMethodId` (Cash, POS, Gift Card, or any admin-defined `ManualPaymentMethod`)
- Calls `refreshBookingPaymentStatus()`
- Sets booking to `CONFIRMED`
- Creates Google Calendar event
- Fires `app/payment.payment-received` Inngest event

Gift card redemption (`POST /api/gift-cards/redeem`) follows the same shape: it creates a `MANUAL` `Payment` with `providerRef` prefixed `GIFTCARD_...` and a `rawPayload.method: "Gift Card"` marker, then reuses the exact same confirm/calendar/notify steps as mark-as-paid.

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

## 10. Gift Card System

Gift cards are **stored-value**, not tied to a specific service or product — the purchaser picks an amount (preset GHS 100/200/300/500/1000, or custom), and the recipient can spend it on anything at booking time, across one or many bookings, until the balance is exhausted.

### Purchase Flow

```
1. Customer fills GiftCardBuilder (/gift-cards)
   → amount, sender details, recipient details, delivery method (EMAIL | SMS | BOTH)

2. POST /api/gift-cards
   a. CreateGiftCardSchema.parse(body)
   b. giftCardRepository.create() → GiftCard (status: PENDING_PAYMENT, balance = totalAmount)
   c. initializeTransaction(..., channels: ["mobile_money"], PRIMARY_PAYSTACK)
      — card payments are intentionally NOT offered for gift cards, mobile money only
   ← { authorizationUrl, reference }

3. Customer completes payment on Paystack hosted checkout

4. GET /api/gift-cards/verify/[reference]  (customer redirected here after payment)
   → verifies transaction with Paystack
   → giftCardRepository.activate() → status: ACTIVE, paymentStatus: PAID
   → gift-card-delivery.service.ts → deliverGiftCard()
        - sends recipient email (React Email template) and/or SMS (Arkesel)
        - message includes the code and a redeem link: /customer/booking?giftCard=<code>
        - giftCardRepository.markDelivered()
```

### Redemption Flow

```
POST /api/gift-cards/redeem  { code, bookingId, amount }
  (rate-limited: 10 requests / 10 min per IP — see §16)
  1. Look up gift card by code; reject if PENDING_PAYMENT / CANCELLED / EXPIRED / already REDEEMED
  2. Load the booking, compute remaining balance owed
     (calculateBookingTotal - sum of PAID payments)
  3. Cap the redemption to min(requested amount, gift card balance, booking remaining balance)
  4. giftCardRepository.redeem() — optimistic compare-and-swap on GiftCard.balance
     (retries up to 5x if a concurrent redemption races ahead; prevents over-debiting
     a card that's being redeemed from two places at once)
  5. Create a MANUAL Payment (providerRef: GIFTCARD_<code>_<timestamp>) for the applied amount
  6. refreshBookingPaymentStatus()
  7. If now fully paid: booking → CONFIRMED, create Google Calendar event,
     fire app/payment.payment-received
  ← { amountApplied, remainingBalance, giftCardBalance, bookingPaymentStatus }
```

`GiftCardRedemption` rows form an append-only ledger of every partial redemption against a card, each optionally linked to the booking it paid for and the staff member (`redeemedById`) who applied it.

### Cancellation

`POST /api/gift-cards/[id]/cancel` (ADMIN) — sets `status = CANCELLED`, preventing further redemption. Does not affect redemptions that already happened.

### Admin View

`/gift-card-orders` lists all gift cards with search (code, sender, recipient) and status filter, using `GiftCardOrdersShell`.

---

## 11. Inventory — Products & Materials

Two parallel but distinct inventory systems, both reusing the shared `StockMovementType` enum (`IN | OUT | ADJUSTMENT`):

| | **Product** | **Material** |
|---|---|---|
| Purpose | Retail items sold to customers (e.g. shampoo, styling products) | Internal consumables used to perform services (e.g. hair dye, nail polish) |
| Sold to customer? | Yes — attachable to a `Booking` via `BookingProduct` | No — issued internally to a `Section` |
| Stock tracking | Optional per-product (`trackStock` boolean) | On by default (`trackStock`, default `true`) |
| Quantity type | Integer (`stockQuantity: Int`) | Decimal (`stockQuantity: Decimal(12,2)`) — supports fractional units like `ml`/`g` |
| Cost tracking | Not tracked per-unit | `unitCost` snapshotted on every movement for accurate period cost reports |
| Category model | `ProductCategory` | `MaterialCategory` |
| Movement model | `ProductStockMovement` | `MaterialMovement` (also records the issuing `Section`) |
| Low-stock alert event | `app/product.low-stock` | `app/material.low-stock` |

### Products

- Admin CRUD at `/products` (`ProductsClientShell`, `ProductCard`). Cards show a stock badge — "In stock", "Low stock · N", "Out of stock", or "No stock tracking" — depending on `trackStock`/`stockQuantity`/`lowStockThreshold`.
- Stock is adjusted via `POST /api/products/stock-tracking`, which records a `ProductStockMovement` and updates `Product.stockQuantity`. Falling at/below `lowStockThreshold` (or hitting zero) fires `app/product.low-stock` → admin SMS + email alert (`sendLowStockAlertEmail`).
- Products can be attached to a booking (`BookingProduct`), snapshotting `priceAtBooking` the same way `BookingService` does, so a later product price change doesn't retroactively affect past bookings.

### Materials

Materials model **internal consumption for cost accounting**, separate from anything sold to a customer.

- **`Section`** — a cost centre (e.g. "Nails", "Barber", "Hair"). Seeded from existing `ServiceCategory` rows via `POST /api/sections/seed`, but kept as an independent model so a section can exist without being a bookable service category.
- `MaterialRepository.recordMovement()` handles all three movement types atomically inside a transaction:
  - `IN` — restock/purchase (adds quantity; may update `unitCost` if the restock price changed)
  - `OUT` — issue to a `Section` (subtracts quantity; **requires** a `sectionId`; throws if it would go negative)
  - `ADJUSTMENT` — set stock to an exact count (stock-take corrections)
- Every movement snapshots `unitCostAtMovement`, so `getUsageBySection(from, to)` — the cost report shown on `/materials/usage` and embedded in `/reports` — reflects the actual cost paid at time of issuance, not today's price.
- Low stock triggers `app/material.low-stock`, reusing the same admin SMS/email alert path as products.

### Reports Integration

`/reports` calls `materialRepository.getUsageBySection(monthStart, now)` for the current month and renders it via `MaterialCostSummary`, alongside the existing booking metrics. This call is wrapped in a `try/catch` so the Reports page still renders if the materials tables haven't been migrated yet in a given environment.

---

## 12. Background Jobs — Inngest

Inngest provides durable, retryable background functions. The server endpoint is at `/api/inngest`. The Inngest client id is `"polarisbeautylounge.com"` (`src/lib/inngest.ts`).

In development: `inngest-cli dev` runs alongside Next.js via `concurrently` in `npm run dev`.
In production: Inngest cloud polls the `/api/inngest` endpoint.

### Registered Functions

| Function id | Trigger event | Emitted from | Purpose |
|---|---|---|---|
| `booking-created` (stub) | `app/booking.booking-created` | `POST /api/bookings` | Reserved for future notification logic |
| `booking-updated` | `app/booking.booking-updated` | Booking edit flow | Reacts to changes in services/products/date/time on an existing booking |
| `stylist-assigned` | `app/booking.stylist-assigned` | `PATCH /api/bookings/[id]/assign` (per-service assignment) | Notifies the assigned stylist |
| `booking-cancel` | `app/booking.booking-cancel` | `POST /api/bookings/[id]/cancel` | Sends cancellation email (Resend) + SMS (Arkesel) |
| `payment-received-admin-notify` | `app/payment.payment-received` | Paystack webhooks, `mark-as-paid`, gift card redemption | Emails all admins, SMS's the customer a confirmation + summary link |
| `password-reset` | `app/password.password-reset` | `POST /api/forgot-password` | Generates `PasswordResetToken`, sends reset email |
| `product-low-stock` | `app/product.low-stock` | Product stock movement crossing threshold | Admin SMS + email alert |
| `material-low-stock` | `app/material.low-stock` | Material stock movement crossing threshold | Admin SMS + email alert (shares the product alert's email template) |

### Event Type Safety

All event schemas are typed in `src/lib/inngest.ts` via `EventSchemas.fromRecord<Events>()`. Calling `inngest.send(...)` with a mistyped payload is a compile-time error.

---

## 13. External Services

### Paystack (Dual Gateway)

Two independent Paystack accounts, both managed in `src/lib/paystack.ts`.

| Variable | Account |
|---|---|
| `PRIMARY_PAYSTACK_SECRET_KEY` | Primary gateway |
| `SECONDARY_PAYSTACK_SECRET_KEY` | Secondary / failover gateway |

The `initializeTransaction`, `verifyTransaction`, and `initiateRefund` functions accept a `provider` parameter that selects which secret key to use, and an optional `channels` array (gift card purchases restrict this to `["mobile_money"]`).

Webhook signatures are verified using HMAC-SHA512 of the raw request body against `x-paystack-signature`.

### Google Calendar

`src/lib/google-calendar.ts` authenticates via a **Google Service Account JWT** (`GOOGLE_SERVICES_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`). On booking confirmation, `createCalendarEvent(booking)` creates a calendar event on the calendar specified by `GOOGLE_CALENDAR_ID`, with the booking reference, client name, services, and duration as the event body.

### Resend

`src/lib/resend.ts` exports a `Resend` client. Emails are composed using **React Email** templates in `src/emails/` (and per-feature `emails/` folders) and rendered to HTML via `@react-email/render` before being sent.

Templates:
- `BookingCancelledEmail` — sent to client on cancellation
- `PaymentLinkEmail` — payment link for customer (if needed)
- `PaymentReceivedEmail` — admin notification on payment
- `EmailPasswordResetEmail` — password reset link
- `send-gift-card-email.tsx` — recipient notification for a purchased gift card
- `send-low-stock-alert-email.tsx` — shared by product and material low-stock alerts
- `send-feedback-request-email.tsx` — post-visit review/feedback request, links to the Google review link

### Arkesel (SMS)

`src/lib/arkesal.ts` sends SMS via the Arkesel HTTP API (`ARKESEL_API_KEY`). Phone numbers are automatically formatted: local `024...` → international `2334...` format for Ghana. Used for booking confirmation/cancellation, gift card delivery, and low-stock alerts.

### Inngest

`src/lib/inngest.ts` creates the `Inngest` client with the app ID `"polarisbeautylounge.com"`. The signing key (`INNGEST_SIGNING_KEY`) and event key (`INNGEST_EVENT_KEY`) authenticate communication with the Inngest cloud. `INNGEST_DEV` toggles local dev mode.

---

## 14. File Storage — MinIO

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

Used for service images, product images, and style images alike.

### Legacy URL Rewrite

`ServiceRepository.getAllServices()` silently rewrites image URLs containing the old domain `polarisbeauty.biz` to the current domain `polarisbeautylounge.com`, maintaining backward compatibility after a domain migration without a database update.

---

## 15. Email & SMS Notifications

### Trigger Map

| Event | Email | SMS |
|---|---|---|
| Booking confirmed (payment received) | Admin notified | Customer confirmation SMS with summary link |
| Booking cancelled | Customer cancellation email | Customer cancellation SMS |
| Password reset requested | User reset link email | — |
| Gift card purchase confirmed | Recipient notification (code + redeem link) | Recipient notification (if SMS/BOTH delivery) |
| Product/material low stock | All admins alerted | All admins with a phone number alerted |
| Post-visit feedback request | Customer review-request email (Google review link) | — |

### Email Templates

Located in `src/emails/` (shared) and per-feature `features/<name>/emails/` folders (feature-specific, e.g. gift cards, low-stock alerts, feedback requests). Built with React Email (`@react-email/components`, `@react-email/render`). Rendered server-side to HTML strings before being passed to Resend.

### SMS

Arkesel delivers to Ghanaian mobile numbers. Number formatting is handled in `lib/arkesal.ts`. SMS content includes: client name, booking reference, date/time, services, and a summary link (bookings); code, amount, and a redeem link (gift cards); item name and current stock (low-stock alerts).

---

## 16. Rate Limiting

`src/lib/rate-limit.ts` implements an **in-memory, per-process, fixed-window** rate limiter — `checkRateLimit(request, scope, limit, windowMs)` returns a `429 NextResponse` (with `Retry-After`) if the caller's IP has exceeded `limit` requests to that `scope` within the window, otherwise `null`.

There is no Redis or shared store: this does not coordinate across multiple app instances and resets on restart. It exists specifically to stop the unauthenticated, previously-unthrottled brute-force/enumeration surface — login, password reset, gift card validation/redemption — from being trivially scriptable. Buckets are swept every 5 minutes so the in-memory map doesn't grow unbounded.

This is a pragmatic stopgap, not a substitute for a distributed limiter if the app is ever scaled to multiple instances behind the load balancer.

---

## 17. SEO & FAQ Content

`src/lib/site-config.ts` is the single source of truth for the business's public NAP (name/address/phone), hours, and other facts fed into page metadata, the sitemap, `robots.txt`, and JSON-LD structured data. It must stay in sync with the Google Business Profile — inconsistent NAP data hurts local search ranking.

`src/features/faq/content.ts` holds a static, curated FAQ array (question/answer pairs grounded in real salon policy — deposits, non-refundable bookings, postponement, accepted payment methods, opening hours). It feeds both the human-readable `/faq` page and a `FAQPage` JSON-LD block, written so each answer is self-contained enough to be quoted directly by AI answer engines (Google AI Overviews, ChatGPT, Perplexity, Gemini).

---

## 18. Deployment Architecture

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

### One-off Bootstrap Scripts

Because the `runner` image only ships `.next/standalone`'s tree-shaken `node_modules`, `prisma/`, and `generated/` — no `src/`, no `tsconfig.json` (so no `@/...` path aliases), and no `@prisma/adapter-pg` — a handful of operational scripts under `prisma/` are written **self-contained**, talking to Postgres directly via the raw `pg` driver instead of the generated Prisma Client:

| Script | Purpose | Run as |
|---|---|---|
| `create-admin.ts` | Bootstrap the first `ADMIN` user on a fresh database | `npx tsx prisma/create-admin.ts` |
| `import-services.ts` | Bulk-create `ServiceCategory`/`Service` rows from `services-import-data.json` (a price-list spreadsheet export). Idempotent — matches by name+category, only fills in what's missing | `npx tsx prisma/import-services.ts` |
| `remove-imported-services.ts` | Reverses the import — deletes exactly the (name, category) pairs recorded in the same JSON file. Skips any service that already has bookings against it (no cascade on that FK by design), and only deletes a category once it has zero remaining services | `npx tsx prisma/remove-imported-services.ts` |

All three are run from `/app` inside the production runner container (matching where `docker-entrypoint.sh` invokes `prisma db push`), and read `DIRECT_URL`/`DATABASE_URL` directly from the environment.

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

## 19. Key Architectural Decisions

### No middleware.ts for auth
Auth guards are called inline in each route/page rather than in a single `middleware.ts`. This avoids Edge runtime constraints (Prisma does not run on the Edge), keeps auth logic co-located with the protected resource, and makes it easier to apply different auth requirements per route.

### Permission-based RBAC layered on top of role-based auth
Rather than replacing the simple `UserRole` enum, a `Role` model with a `permissions: String[]` array was added alongside it, and every guard function grew an optional `permission` parameter. `ADMIN`/`SUPER_ADMIN` still bypass everything; only `STAFF` accounts are gated by permission. This kept every existing `requireRole([UserRole.ADMIN])` call site working unmodified while allowing new/updated call sites to opt into fine-grained control incrementally, rather than requiring a big-bang migration of every route.

### Gift cards as stored-value, not itemized
Gift cards do not lock the recipient into specific services or products (the `GiftCardItem` model exists only for a legacy itemized path). This makes redemption simple — it's a balance decrement against whatever booking the recipient wants — at the cost of not being able to guarantee margin on a specific service the way a fixed "spa day package" voucher would.

### Materials are separate from Products, not a stock-tracking flag on Service
Rather than bolting stock tracking onto `Service`, internal consumables get their own `Material`/`Section`/`MaterialMovement` models, decimal-quantity aware (`ml`, `g`, etc.) and cost-snapshotting. This keeps "what we sell" (`Service`, `Product`) cleanly separate from "what we consume internally to deliver what we sell," which is a different reporting axis (cost-by-section vs. revenue-by-service).

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

### Self-contained bootstrap scripts for the production runner image
`create-admin.ts`, `import-services.ts`, and `remove-imported-services.ts` deliberately avoid the generated Prisma Client, `@/` path aliases, and `@prisma/adapter-pg`, using the raw `pg` driver instead. The production runner image only contains `.next/standalone`'s tree-shaken dependencies plus `prisma/` and `generated/` — no `src/`, no `tsconfig.json` — so anything meant to run inside that container via `npx tsx` has to be self-sufficient.

### In-memory rate limiting over a Redis-backed limiter
Given the single-instance deployment (§18), a per-process fixed-window limiter in `lib/rate-limit.ts` closes the obvious brute-force gaps (login, password reset, gift card redemption) without introducing a new infrastructure dependency. It's explicitly documented as not surviving a restart or coordinating across instances — acceptable today, but should be revisited before any horizontal scaling.

### z.input<> vs z.infer<> for form types
Zod v4's `z.infer<>` returns the output type (after transforms/defaults). When used with `useForm<T>` and `zodResolver`, this causes a TypeScript mismatch because the resolver types against the input type (before defaults are applied). All form types use `z.input<typeof Schema>` to match the resolver's expectation.

---

*Last updated: automatically generated from codebase audit.*
