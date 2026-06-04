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
export type GatewayPaymentMetrics = {
  primaryNetTotal: number
  secondaryNetTotal: number
  /** Actual distribution: primary share of total (0–100) */
  primaryPercentage: number
  /** Actual distribution: secondary share of total (0–100) */
  secondaryPercentage: number
  /** Target for primary (0–100). Used by allocation policy. */
  routingThreshold: number
  primaryLastWebhookAt: string | null
  secondaryLastWebhookAt: string | null
}


export type PaymentFilters = {
  serviceId?: string
  from?: string
  to?: string
  search?: string
  gateway?: string
  status?: string
}


export type PaymentWithBookingAndService = PaymentGetPayload<{
  include: {
    booking: {
      include: {
        services: { include: { service: true } },
        payments: true
      }
    }
  }
}>