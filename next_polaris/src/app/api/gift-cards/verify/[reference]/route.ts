import { NextRequest, NextResponse } from "next/server"
import { verifyTransaction } from "@/lib/paystack"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { deliverGiftCard } from "@/features/gift-card/server/gift-card-delivery.service"
import { PaymentProvider } from "@generated/prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params

    const giftCard = await giftCardRepository.findByPaymentRef(reference)
    if (!giftCard) {
      return NextResponse.json({ success: false, message: "Gift card not found" }, { status: 404 })
    }

    if (giftCard.status === "PENDING_PAYMENT") {
      const provider = (giftCard.paymentProvider as PaymentProvider) ?? PaymentProvider.PRIMARY_PAYSTACK
      const verification = await verifyTransaction(reference, provider)

      if (verification.status && verification.data.status === "success") {
        const activated = await giftCardRepository.activate(giftCard.id)

        // Best-effort delivery — don't fail the response if SMS/email sending errors out
        deliverGiftCard(activated).catch((err) =>
          console.error("Failed to deliver gift card:", err)
        )

        return NextResponse.json({ success: true, data: activated })
      }

      return NextResponse.json({
        success: true,
        data: giftCard,
        message: "Payment not yet completed",
      })
    }

    return NextResponse.json({ success: true, data: giftCard })
  } catch (error: any) {
    console.error("Error verifying gift card payment:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
}
