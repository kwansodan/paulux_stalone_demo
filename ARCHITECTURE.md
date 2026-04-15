# Polaris Beauty Lounge — Architecture & Onboarding Guide

> **Audience:** New developer taking over this project.
> **Rule:** Never edit production files without a reviewed plan and explicit approval.

---

## 1. What Is This Project?

**Polaris** is a full-stack booking and payment management system for **Polaris Beauty Lounge** (`polarisbeautylounge.com`). It lets:

- **Customers** browse services, book appointments, pay online (or via link), reschedule, and cancel.
- **Admins/Staff** manage bookings, services, payments, availability, and view reports — all from a dashboard.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Database | PostgreSQL 15 |
| ORM | Prisma 7 (with `@prisma/adapter-pg` — direct pg driver) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| Data fetching (client) | TanStack React Query v5 |
| Forms | React Hook Form + Zod validation |
| Background jobs | Inngest (event-driven async workflows) |
| Payments | Paystack (dual-gateway setup — Primary + Secondary) |
| Email | Resend + React Email (template components) |
| SMS | Arkesel |
| File storage | MinIO (self-hosted, S3-compatible) |
| Calendar | Google Calendar API (service account) |
| Reverse proxy | Caddy 2 (handles TLS automatically) |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions → SSH → OVH VPS |
| Container management | Portainer |

---

## 3. Repository Structure

```
polaris/                          ← repo root
├── next_polaris/                 ← the entire Next.js application
│   ├── prisma/
│   │   └── schema.prisma         ← database schema (source of truth)
│   ├── src/
│   │   ├── app/                  ← Next.js App Router pages & API routes
│   │   ├── components/           ← shared UI components
│   │   ├── features/             ← domain-driven feature modules
│   │   ├── lib/                  ← third-party client singletons (Prisma, Paystack, Minio…)
│   │   ├── utils/                ← pure utility functions
│   │   ├── emails/               ← React Email templates
│   │   └── constants.ts          ← app-wide constants
│   ├── Dockerfile.prod           ← production Docker image
│   ├── Dockerfile.dev            ← development Docker image
│   └── package.json
├── docker-compose.yml            ← production stack (app, db, minio, caddy, portainer)
├── docker-compose.dev.yml        ← local dev stack
├── Caddyfile                     ← reverse proxy config (TLS + routing)
├── example.env                   ← all required env vars with descriptions
├── .github/workflows/deploy.yml  ← CI/CD pipeline
└── DEPLOYMENT.md / MIGRATION_GUIDE.md / etc.
```

---

## 4. Application Structure (`src/`)

### 4.1 App Router Layout (`src/app/`)

Next.js uses **route groups** to separate the two user experiences:

```
app/
├── (admin)/              ← Admin-only pages (sidebar layout)
│   ├── layout.tsx        ← wraps pages with Sidebar + mobile header
│   ├── dashboard/
│   ├── bookings/
│   │   └── confirmation/
│   ├── payments/
│   ├── services/
│   ├── availability/
│   └── reports/
│
├── (customer)/           ← Public-facing customer flow
│   ├── layout.tsx
│   ├── home/
│   └── customer/
│       ├── services/     ← browse services
│       └── booking/
│           ├── page.tsx  ← 4-step booking wizard
│           ├── reschedule/[id]/
│           └── summary/[id]/
│
├── api/                  ← All API route handlers (REST-style)
│   ├── bookings/
│   ├── services/
│   ├── payments/
│   ├── paystack-primary/webhook/
│   ├── paystack-secondary/webhook/
│   ├── business-hours/
│   ├── blocked-dates/
│   ├── upload/
│   ├── login/
│   ├── logout/
│   ├── forgot-password/
│   ├── reset-password/[tokenId]/
│   └── inngest/          ← Inngest webhook handler
│
├── login/
├── forgot-password/
├── reset-password/[tokenId]/
├── unauthorized/
├── _auth/                ← Auth helper functions (server-only)
├── _navigation/sidebar/  ← Sidebar nav definition + components
└── paths.ts              ← Centralised route path functions
```

### 4.2 Feature Modules (`src/features/`)

Each feature is self-contained with this consistent internal structure:

```
features/<domain>/
├── client/          ← React Query hooks (data fetching from the browser)
├── components/      ← UI components (forms, cards, tables, etc.)
├── server/          ← Repository classes (Prisma queries) + service classes (business logic)
├── emails/          ← Email-sending functions using Resend
├── events/          ← Inngest event trigger functions
├── utils/           ← Zod schemas (validation) + helper functions
└── types.ts         ← TypeScript type definitions
```

**Active feature modules:**

| Feature | Description |
|---|---|
| `auth` | Login, logout, session management, password reset |
| `booking` | Creating, editing, cancelling, rescheduling bookings |
| `service` | CRUD for beauty services (price, duration, image, active/inactive) |
| `payment` | Paystack integration, dual-gateway routing, invoicing |
| `invoice` | Invoice creation and lifecycle tracking per booking |
| `business-hour` | Opening hours by day-of-week |
| `blocked-date` | Blocking specific dates (e.g., holidays) |

---

## 5. Database Schema

Managed by **Prisma** (`prisma/schema.prisma`). Generated client output goes to `../generated/prisma`.

### Models at a glance

| Model | Purpose |
|---|---|
| `User` | Admin/staff accounts. Roles: `ADMIN`, `CUSTOMER`, `STAFF` |
| `Session` | Session tokens for custom auth (not NextAuth) |
| `PasswordResetToken` | Time-limited tokens for password reset emails |
| `Service` | Beauty services with price, duration, image, booking limits |
| `Booking` | An appointment — holds client info, date/time, status, payment status |
| `BookingService` | Join table: which services are in a booking (snapshot price/duration at time of booking) |
| `Payment` | Individual Paystack payment records linked to a booking |
| `Invoice` | Invoice per payment attempt, supports parent-child (top-up) relationships |
| `PaymentAuditLog` | Immutable audit trail of every payment action/status change |
| `BusinessHour` | One row per day (0=Sun → 6=Sat) with open/close times |
| `BlockedDate` | Dates (or partial times) when bookings are disabled |
| `SystemSetting` | Key-value config store (e.g., gateway routing threshold) |

### Key enums

- `BookingStatus`: `PENDING → CONFIRMED → COMPLETED / CANCELLED`
- `PaymentStatus`: `PENDING / PAID / PARTIAL / REFUNDED / FAILED`
- `PaymentProvider`: `PRIMARY_PAYSTACK`, `SECONDARY_PAYSTACK`, `MANUAL`
- `InvoiceStatus`: `DRAFT → PENDING → ISSUED → PAID / VOID / OVERDUE`
- `UserRole`: `ADMIN`, `STAFF`, `CUSTOMER`

---

## 6. Authentication

This app uses **custom session-based auth** (not NextAuth/Auth.js, despite the env var name).

**How it works:**
1. On login, server creates a `Session` record in the database.
2. A session cookie (`session`) is set in the browser containing the raw session token.
3. Every server request hashes the cookie token and looks it up in the `Session` table.
4. Sessions last **30 days**, and are silently refreshed when within 15 days of expiry.

**Auth guard functions** (in `src/app/_auth/`):

| Function | Use |
|---|---|
| `isAuthenticated()` | Returns `{ user, session }` or nulls — no redirect |
| `requireAuth()` | Redirects to `/login` if not authenticated |
| `requireRole(roles[])` | Redirects to `/unauthorized` if role doesn't match |
| `requireAuthApi()` | For API routes — returns 401 instead of redirecting |
| `requireRoleApi(roles[])` | For API routes — returns 403 instead of redirecting |

All auth helpers use React's `cache()` to deduplicate calls per request.

---

## 7. Payment System (Dual-Gateway)

This is the most complex part of the codebase. Polaris runs **two Paystack accounts** (Primary and Secondary) for transaction volume distribution.

### Gateway Selection Logic (`gateway-selection.service.ts`)

On each payment:
1. Fetch today's allocation metrics (how much has gone through each gateway).
2. Compare against a configurable threshold stored in `SystemSetting`.
3. Route to whichever gateway is below its threshold percentage.
4. First booking of the day always goes to Secondary.

### Payment Initialization Flow (`payment-processing.service.ts`)

```
Customer pays
  → Select gateway (automatic or forced)
  → Create Invoice (DRAFT → PENDING) — before calling Paystack
  → Initialize Paystack transaction (with retry: 0ms, 2s, 5s)
  → On all retries failed → FAILOVER to the other gateway
  → Return payment URL to customer
  → Customer completes payment on Paystack hosted page
  → Paystack calls webhook → /api/paystack-primary/webhook or /api/paystack-secondary/webhook
  → Webhook verifies, records Payment, updates Booking & Invoice status
  → Fires Inngest "payment.received" event
```

### Webhook Routes

- `/api/paystack-primary/webhook` — handles Primary Paystack account callbacks
- `/api/paystack-secondary/webhook` — handles Secondary Paystack account callbacks

Every step is recorded in `PaymentAuditLog` for full traceability.

---

## 8. Background Jobs (Inngest)

Inngest handles async event-driven tasks. The Inngest dev server runs alongside Next.js in development (`npm run dev` uses `concurrently`).

**Registered events:**

| Event | Trigger | Handler |
|---|---|---|
| `app/booking.booking-cancel` | Booking cancelled | Send cancellation email to client |
| `app/password.password-reset` | Forgot password submitted | Send password reset email |
| `app/payment.payment-received` | Webhook confirms payment | Send payment receipt email, update statuses |

The Inngest API route is at `/api/inngest`.

---

## 9. File Uploads (MinIO)

Service images are uploaded to **MinIO** (self-hosted S3-compatible storage).

Flow:
1. Client requests a presigned URL from `/api/upload/presign`.
2. Client uploads directly to MinIO using the presigned URL.
3. MinIO is proxied via Caddy at `/files/*` for public access.

---

## 10. Email & SMS

| Integration | Purpose | Env Var |
|---|---|---|
| **Resend** | Transactional emails (booking confirm, cancel, payment receipt, password reset) | `RESEND_API_KEY` |
| **React Email** | Email template components in `src/emails/` | — |
| **Arkesel** | SMS notifications | `ARKESEL_API_KEY` |

---

## 11. Google Calendar Integration

When a booking is created, the app creates a Google Calendar event using a **service account** (`GOOGLE_SERVICES_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`). Calendar ID is set via `GOOGLE_CALENDAR_ID`. Failure is non-blocking — it logs a warning but doesn't break the booking flow.

---

## 12. Deployment & Infrastructure

### Stack (Production)

All services run in Docker on an **OVH VPS** via Docker Compose:

```
Internet
  └── Caddy (ports 80/443, auto TLS)
        ├── → polaris_app (Next.js, port 3000)
        └── /files/* → polaris_minio (port 9000)

polaris_app → polaris_db (PostgreSQL, port 5432)
polaris_app → polaris_minio (internal)

Portainer (port 9443) — Docker management UI
```

### CI/CD Pipeline (`.github/workflows/deploy.yml`)

Triggered on every push to `main`:
1. `rsync` project files to OVH VPS (excluding `.git`, `node_modules`, `.env`).
2. SSH in and run `docker compose up -d --build`.
3. Prune unused images.
4. Health check: `curl https://polarisbeautylounge.com`.

**Required GitHub Secrets:** `OVH_SSH_KEY`, `OVH_HOST`

### Environment Variables

Copy `example.env` to `.env` and fill in all values. Key groups:

| Group | Variables |
|---|---|
| Database | `DATABASE_URL`, `DIRECT_URL`, `DB_USER`, `DATABASE_PASSWORD` |
| Auth | `NEXTAUTH_SECRET` |
| Paystack | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` + secondary variants |
| Email | `RESEND_API_KEY` |
| SMS | `ARKESEL_API_KEY`, `ARKESAL_BASE_URL` |
| MinIO | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME` |
| Google | `GOOGLE_SERVICES_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| App | `NEXT_PUBLIC_APP_URL`, `NODE_ENV` |

---

## 13. Local Development

```bash
# 1. Clone and install
cd next_polaris
npm install          # also runs "prisma generate" via postinstall

# 2. Set up env
cp ../example.env .env.local
# fill in DATABASE_URL (pointing to local/docker postgres), etc.

# 3. Start dev server (Next.js + Inngest dev server concurrently)
npm run dev

# 4. Run database migrations (if schema changed)
npx prisma migrate dev

# 5. Seed the database
npm run prisma-seed
```

For Docker-based local dev, use `docker-compose.dev.yml`.

---

## 14. Key Patterns to Know

### Repository Pattern
Every feature's database access goes through a `*.repository.ts` class that wraps Prisma queries. Business logic goes in `*.service.ts` files. API routes call services/repositories — they do not contain business logic themselves.

### Prisma Client Setup
The Prisma client is a singleton in `src/lib/prisma.ts` using the `pg` adapter directly (not connection pooling middleware). Uses `DIRECT_URL` env var, not `DATABASE_URL`. This is intentional for the pg adapter pattern.

### Centralised Routes
All URL paths are defined in `src/app/paths.ts` as typed functions. Always use these — never hardcode strings like `"/bookings"` in components.

### Client Data Fetching
All client-side data fetching uses **React Query** hooks defined in `features/<domain>/client/`. The React Query provider is set up in `src/lib/react-query.tsx`.

### Price Snapshot on Booking
When a booking is created, the service's price and duration are copied into the `BookingService` join table (`priceAtBooking`, `durationAtBooking`). This means changing a service's price later won't affect existing bookings.

---

## 15. Where to Start as a New Developer

1. **Read `example.env`** — understand all the external services the app depends on.
2. **Read `prisma/schema.prisma`** — this is the data model for the entire app.
3. **Explore `src/app/paths.ts`** — understand all the routes.
4. **Trace a booking end-to-end:**
   - Customer: `(customer)/customer/booking/page.tsx` → `customer-booking-form.tsx` → `POST /api/bookings`
   - Admin: `(admin)/bookings/page.tsx` → booking table/filters → edit/cancel forms
5. **Understand payments:** Read `payment-processing.service.ts` and the two webhook routes.
6. **Check the docs** in the repo root: `DEPLOYMENT.md`, `MIGRATION_GUIDE.md`, `DOCKER_MIGRATIONS.md`, `MINIO_GUIDE.md`, `GATEWAY_DOCUMENTATION.md` (in `next_polaris/`).
