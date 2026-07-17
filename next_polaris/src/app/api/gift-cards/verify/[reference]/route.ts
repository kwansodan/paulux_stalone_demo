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
        // Confirm Paystack charged what we expected (stored value grossed up by the
        // fee) before granting the card its value. Never activate at full value on
        // an amount we can't confirm.
        const expectedPesewas = Math.round(
          (Number(giftCard.totalAmount) + Number(giftCard.feeAmount)) * 100
        )
        const paidPesewas = Number(verification.data.amount)
        const amountMatches =
          Number.isFinite(paidPesewas) && Math.abs(paidPesewas - expectedPesewas) <= 2

        if (!amountMatches) {
          console.error(
            `Gift card ${giftCard.code} amount mismatch — expected ${expectedPesewas} pesewas, got ${paidPesewas} (ref ${reference}). Not activating.`
          )
          return NextResponse.json(
            { success: false, message: "Payment amount could not be verified. Please contact support." },
            { status: 400 }
          )
        }

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
