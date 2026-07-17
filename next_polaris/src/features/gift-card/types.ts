import { GiftCard, GiftCardItem, GiftCardRedemption } from "@generated/prisma/client"

export type GiftCardStatusType =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "PARTIALLY_REDEEMED"
  | "REDEEMED"
  | "EXPIRED"
  | "CANCELLED"

export type GiftCardDeliveryMethodType = "SMS" | "EMAIL" | "BOTH"

export type GiftCardItemTypeValue = "SERVICE" | "PRODUCT"

export type SerializedGiftCardItem = Omit<GiftCardItem, "unitPrice"> & {
  unitPrice: string
}

export type SerializedGiftCardRedemption = Omit<GiftCardRedemption, "amountApplied" | "createdAt"> & {
  amountApplied: string
  createdAt: string
}

export type SerializedGiftCard = Omit<
  GiftCard,
  "totalAmount" | "balance" | "feeAmount" | "createdAt" | "updatedAt" | "expiresAt" | "deliveredAt"
> & {
  totalAmount: string
  balance: string
  feeAmount: string
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  deliveredAt: string | null
  items: SerializedGiftCardItem[]
  redemptions?: SerializedGiftCardRedemption[]
}

export interface CreateGiftCardPayload {
  senderName: string
  senderEmail: string
  senderPhone: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  message?: string
  deliveryMethod: GiftCardDeliveryMethodType
  amount: number
  callbackUrl?: string
}

export interface ValidateGiftCardResponse {
  valid: boolean
  giftCardId?: string
  code?: string
  balance?: number
  message?: string
}
