import { PaymentStatus, Prisma } from "@generated/prisma/client";

export interface BookingQueryResult {
  bookings: BookingWithService[];
  count?: number;
  revenue?: number;
}

export interface BookingQueryOptions {
  includeCount?: boolean;
  includeRevenue?: boolean;
}

export type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    services: {
      include: {
        service: true
      }
    },
    payments: true,
    assignedTo: {
      select: {
        id: true,
        username: true,
        phone: true,
      }
    },
  }
}>
export type BookingWithServiceAndPayment = Prisma.BookingGetPayload<{
  include: {
    services: {
      include: {
        service: true
      }
    },
    payments: true,
    assignedTo: {
      select: {
        id: true,
        username: true,
        phone: true,
      }
    },
  }
}>

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