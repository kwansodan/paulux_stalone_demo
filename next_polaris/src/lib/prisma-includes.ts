import { Prisma } from "@generated/prisma/client"

// Base shape — satisfies the local Prisma client for type derivation
const _base = {
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
  payments: {
    include: {
      manualMethod: { select: { name: true } },
    },
  },
  assignedTo: {
    select: {
      id: true,
      username: true,
      phone: true,
    },
  },
  promoCode: {
    select: {
      code: true,
      discountType: true,
      discountValue: true,
    },
  },
  giftCardRedemptions: {
    select: {
      amountApplied: true,
      giftCard: { select: { code: true } },
    },
  },
} satisfies Prisma.BookingInclude

/**
 * Canonical include shape for a Booking with all relations needed by the UI.
 * At runtime this also fetches per-service stylist assignments (assignedTo on
 * each BookingService row). TypeScript sees the base shape; the extra field is
 * accessed via `(bs as any).assignedTo` in components.
 */
export const bookingInclude: typeof _base = {
  ..._base,
  services: {
    include: {
      service: true,
      // Per-service stylist assignment — added to schema; local Prisma client
      // may not know about it yet, so we bypass the type check here.
      assignedTo: { select: { id: true, username: true, phone: true } },
    } as any,
  },
}

/**
 * The canonical booking type. Derived from the base include so it stays
 * in sync with the local Prisma client.
 */
export type BookingFull = Prisma.BookingGetPayload<{ include: typeof _base }>
