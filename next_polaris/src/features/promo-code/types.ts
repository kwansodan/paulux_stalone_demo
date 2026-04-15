export type DiscountType = "PERCENTAGE" | "FIXED"

export interface SerializedPromoCode {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: string   // Decimal serialized as string
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  minBookingAmount: string | null
  createdAt: string
  updatedAt: string
}

export interface ValidatePromoCodeResponse {
  valid: boolean
  promoCodeId: string
  discountType: DiscountType
  discountValue: number
  discountAmount: number   // actual GHS saved on this booking
  message?: string
}
