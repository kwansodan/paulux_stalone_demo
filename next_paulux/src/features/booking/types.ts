import { PaymentStatus, Prisma } from "@generated/prisma/client";
import { BookingFull } from "@/lib/prisma-includes";

export interface BookingQueryResult {
  bookings: BookingWithService[];
  count?: number;
  revenue?: number;
}

export interface BookingQueryOptions {
  includeCount?: boolean;
  includeRevenue?: boolean;
}

/**
 * Both aliases resolve to BookingFull — the single canonical booking type
 * derived from bookingInclude in src/lib/prisma-includes.ts.
 * Kept as aliases so existing imports throughout the codebase continue to work.
 */
export type BookingWithService = BookingFull
export type BookingWithServiceAndPayment = BookingFull

export type IBookingMetrics = {
  totalBookings: number
  cancelled: number
  unpaid: number
  completed: number
}

export type BookingFilters = {
  from?: string
  to?: string
  status?: BookingStatus | string
  paymentStatus?: PaymentStatus | string
  search?: string
  time?: string        // HH:mm
}



export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED"
}