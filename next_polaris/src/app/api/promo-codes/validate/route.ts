import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const ValidateSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
  bookingTotal: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, bookingTotal } = ValidateSchema.parse(body)

    const promo = await prisma.promoCode.findUnique({ where: { code } })

    if (!promo) {
      return NextResponse.json({ valid: false, message: "Invalid promo code" }, { status: 200 })
    }
    if (!promo.isActive) {
      return NextResponse.json({ valid: false, message: "This promo code is no longer active" }, { status: 200 })
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, message: "This promo code has expired" }, { status: 200 })
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, message: "This promo code has reached its usage limit" }, { status: 200 })
    }
    if (promo.minBookingAmount !== null && bookingTotal < Number(promo.minBookingAmount)) {
      return NextResponse.json({
        valid: false,
        message: `Minimum booking amount of GHS ${Number(promo.minBookingAmount).toFixed(2)} required`,
      }, { status: 200 })
    }

    // Calculate actual discount amount
    const discountValue = Number(promo.discountValue)
    let discountAmount: number
    if (promo.discountType === "PERCENTAGE") {
      discountAmount = Math.min(bookingTotal * (discountValue / 100), bookingTotal)
    } else {
      discountAmount = Math.min(discountValue, bookingTotal)
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      promoCodeId: promo.id,
      discountType: promo.discountType,
      discountValue,
      discountAmount,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, message: "Invalid request" }, { status: 400 })
    }
    return NextResponse.json({ valid: false, message: error.message }, { status: 500 })
  }
}
