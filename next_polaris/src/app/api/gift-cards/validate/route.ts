import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ValidateGiftCardSchema } from "@/features/gift-card/utils/validation"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = ValidateGiftCardSchema.parse(body)

    const giftCard = await giftCardRepository.findByCode(code)

    if (!giftCard) {
      return NextResponse.json({ valid: false, message: "Invalid gift card code" }, { status: 200 })
    }

    if (giftCard.status === "PENDING_PAYMENT") {
      return NextResponse.json({ valid: false, message: "This gift card has not been activated yet" }, { status: 200 })
    }

    if (giftCard.status === "CANCELLED") {
      return NextResponse.json({ valid: false, message: "This gift card has been cancelled" }, { status: 200 })
    }

    if (giftCard.status === "EXPIRED" || (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date())) {
      return NextResponse.json({ valid: false, message: "This gift card has expired" }, { status: 200 })
    }

    if (giftCard.status === "REDEEMED" || Number(giftCard.balance) <= 0) {
      return NextResponse.json({ valid: false, message: "This gift card has already been fully redeemed" }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      giftCardId: giftCard.id,
      code: giftCard.code,
      balance: Number(giftCard.balance),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, message: "Invalid request" }, { status: 400 })
    }
    return NextResponse.json({ valid: false, message: error.message || "Failed to validate gift card" }, { status: 500 })
  }
}
