import { Prisma } from "@generated/prisma/client"

/**
 * Canonical include shape for a Booking with all relations needed by the UI and services.
 * Import this constant in every prisma.booking.* call whose return value is typed as
 * BookingWithService or BookingWithServiceAndPayment — it guarantees shape consistency
 * and eliminates "Property 'assignedTo' is missing" TypeScript build errors.
 */
export const bookingInclude = {
  services: {
    include: {
      service: true,
    },
  },
  products: {
    include: {
      product: true,
    },
  },
  payments: true,
  assignedTo: {
    select: {
      id: true,
      username: true,
      phone: true,
    },
  },
} satisfies Prisma.BookingInclude

/**
 * The canonical booking type. Derived directly from bookingInclude so it can
 * never drift out of sync.
 *
 * Replace BookingWithService / BookingWithServiceAndPayment usages with this
 * wherever you want the full shape.
 */
export type BookingFull = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>
