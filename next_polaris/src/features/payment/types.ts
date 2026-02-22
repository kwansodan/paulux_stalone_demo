import { PaymentGetPayload } from "@generated/prisma/models"

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}


export type PaymentMetrics = {
  totalDepositsToday: number
  totalBalanceDueToday: number
  thisWeeksRevenue: number
  todaysPendingCollections: number
}


export type PaymentFilters = {
  serviceId?: string
  date: string
  search: string
}


export type PaymentWithBookingAndService = PaymentGetPayload<{
  include: {
    booking: {
      include: {
        service: true
      }
    }
  }
}>