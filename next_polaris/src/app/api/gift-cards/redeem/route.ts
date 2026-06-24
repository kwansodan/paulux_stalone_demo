import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { RedeemGiftCardSchema } from "@/features/gift-card/utils/validation"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { paymentService } from "@/features/payment/server/payment.service"
import { calculateBookingTotal } from "@/features/booking/utils/helpers"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"
import { bookingInclude } from "@/lib/prisma-includes"
import { createCalendarEvent } from "@/lib/google-calendar"
import { inngest } from "@/lib/inngest"
import { PaymentProvider, PaymentStatus } from "@generated/prisma/client"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const rateLimited = checkRateLimit(request, "gift-card-redeem", 10, 10 * 60 * 1000)
    if (rateLimited) return rateLimited

    const body = await request.json()
    const { code, bookingId, amount } = RedeemGiftCardSchema.parse(body)

    const giftCard = await giftCardRepository.findByCode(code)
    if (!giftCard) {
      return NextResponse.json({ success: false, message: "Invalid gift card code" }, { status: 404 })
    }

    if (giftCard.status === "PENDING_PAYMENT" || giftCard.status === "CANCELLED") {
      return NextResponse.json({ success: false, message: "This gift card cannot be redeemed" }, { status: 400 })
    }

    if (giftCard.status === "EXPIRED" || (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date())) {
      return NextResponse.json({ success: false, message: "This gift card has expired" }, { status: 400 })
    }

    if (giftCard.status === "REDEEMED" || Number(giftCard.balance) <= 0) {
      return NextResponse.json({ success: false, message: "This gift card has already been fully redeemed" }, { status: 400 })
    }

    let booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude })
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 })
    }

    const totalPrice = calculateBookingTotal(booking)
    const paidPayments = booking.payments?.filter((p) => p.status === PaymentStatus.PAID) || []
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remainingBalance = Math.max(0, totalPrice - totalPaid)

    if (remainingBalance <= 0) {
      return NextResponse.json({ success: false, message: "This booking is already fully paid" }, { status: 400 })
    }

    // Cap the redemption to the gift card balance and the booking's remaining balance
    const requestedAmount = Math.min(amount, remainingBalance)

    const { giftCard: updatedGiftCard, amountApplied } = await giftCardRepository.redeem(
      giftCard.id,
      bookingId,
      requestedAmount
    )

    // Record the redemption as a PAID payment against the booking
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: PaymentProvider.MANUAL,
        providerRef: `GIFTCARD_${updatedGiftCard.code}_${Date.now()}`,
        amount: amountApplied,
        currency: booking.services[0]?.service.currency || "GHS",
        status: PaymentStatus.PAID,
        rawPayload: { method: "Gift Card", giftCardCode: updatedGiftCard.code },
      },
    })

    // Refresh booking payment status
    await paymentService.refreshBookingPaymentStatus(booking.id)

    booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude })
    const bookingPaymentStatus = booking ? calculatePaymentStatus(booking) : PaymentStatus.PENDING

    // If fully paid, confirm the booking and sync calendar — mirrors mark-as-paid behaviour
    if (booking && bookingPaymentStatus === PaymentStatus.PAID) {
      if (booking.status !== "CONFIRMED") {
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED" },
          include: bookingInclude,
        })
      }

      if (!booking.googleEventId) {
        try {
          const eventId = await createCalendarEvent(booking)
          if (eventId) {
            await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: eventId } })
          }
        } catch (error) {
          console.error("Failed to create calendar event:", error)
        }
      }

      await inngest.send({
        name: "app/payment.payment-received",
        data: {
          bookingId: booking.id,
          amountPaid: amountApplied,
          provider: PaymentProvider.MANUAL,
          manualMethodName: "Gift Card",
        },
      }).catch((err) => console.error("Failed to send payment-received event:", err))
    }

    return NextResponse.json({
      success: true,
      data: {
        amountApplied,
        remainingBalance: Math.max(0, remainingBalance - amountApplied),
        giftCardBalance: Number(updatedGiftCard.balance),
        bookingPaymentStatus,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid request", details: error.issues }, { status: 400 })
    }
    console.error("Error redeeming gift card:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to redeem gift card" }, { status: 500 })
  }
}
