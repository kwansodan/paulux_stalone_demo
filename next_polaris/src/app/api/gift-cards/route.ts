import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CreateGiftCardSchema } from "@/features/gift-card/utils/validation"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { generateGiftCardPaymentReference } from "@/features/gift-card/utils/helpers"
import { initializeTransaction } from "@/lib/paystack"
import { PaymentProvider } from "@generated/prisma/client"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "gift_cards.view")
    if (!auth.ok) return auth.response

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { recipientPhone: { contains: search } },
      ]
    }

    const giftCards = await giftCardRepository.getAll(where as any)

    return NextResponse.json({ success: true, data: giftCards })
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching gift cards:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch gift cards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateGiftCardSchema.parse(body)

    // Stored-value gift card: the purchaser sets the amount directly; it is not
    // tied to any service or product. The recipient spends the balance later.
    const totalAmount = Math.round(validated.amount * 100) / 100

    const reference = generateGiftCardPaymentReference()

    const giftCard = await giftCardRepository.create({
      senderName: validated.senderName,
      senderEmail: validated.senderEmail,
      senderPhone: validated.senderPhone,
      recipientName: validated.recipientName,
      recipientEmail: validated.recipientEmail || null,
      recipientPhone: validated.recipientPhone || null,
      message: validated.message || null,
      deliveryMethod: validated.deliveryMethod,
      totalAmount,
      paymentProvider: PaymentProvider.PRIMARY_PAYSTACK,
      paymentRef: reference,
    })

    const initResponse = await initializeTransaction(
      validated.senderEmail,
      Math.round(totalAmount * 100),
      reference,
      validated.callbackUrl,
      "GHS",
      // Mobile money only — bank cards are intentionally NOT an accepted
      // payment channel for gift card purchases.
      ["mobile_money"],
      PaymentProvider.PRIMARY_PAYSTACK,
      validated.senderPhone
    )

    if (!initResponse.status) {
      return NextResponse.json(
        { success: false, message: initResponse.message || "Failed to initialize payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Gift card created — redirecting to payment",
      data: {
        giftCard,
        authorizationUrl: initResponse.data.authorization_url,
        reference,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating gift card:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create gift card" },
      { status: 500 }
    )
  }
}
