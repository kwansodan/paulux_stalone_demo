import { NextRequest, NextResponse } from "next/server"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { CancelBookingSchema } from "@/features/booking/utils/validation"
import { BookingStatus } from "@generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { initiateRefund } from "@/lib/paystack"
// import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const auth = await requireRoleApi(["ADMIN"])
    // if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const bookingId = awaitedParams.id
    const body = await request.json()
    const { reason } = CancelBookingSchema.parse(body)

    const booking = await bookingRepository.findById(bookingId)

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "Booking already cancelled" },
        { status: 409 }
      )
    }

    // Find all PAID payments for this booking
    const paidPayments = await prisma.payment.findMany({
      where: {
        bookingId: bookingId,
        status: 'PAID',
        provider: 'PAYSTACK',
      },
    })

    const refundResults: any[] = []

    // Initiate refunds for all paid Paystack payments
    for (const payment of paidPayments) {
      try {
        console.log(`Initiating refund for payment ${payment.id}, reference: ${payment.providerRef}`)

        const refundResponse = await initiateRefund(
          payment.providerRef,
          undefined, // Full refund
          `Booking cancelled: ${reason || 'No reason provided'}`,
          'Your booking has been cancelled and a refund has been initiated. Please allow up to 10 business days for the refund to reflect in your account.'
        )

        refundResults.push({
          paymentId: payment.id,
          providerRef: payment.providerRef,
          amount: payment.amount.toString(),
          status: 'refund_initiated',
          refundData: refundResponse.data,
        })

        console.log(`Refund initiated successfully for payment ${payment.id}`)
      } catch (error: any) {
        console.error(`Failed to initiate refund for payment ${payment.id}:`, error.message)
        refundResults.push({
          paymentId: payment.id,
          providerRef: payment.providerRef,
          amount: payment.amount.toString(),
          status: 'refund_failed',
          error: error.message,
        })
      }
    }

    // Cancel the booking
    const cancelled = await bookingRepository.cancelBooking(bookingId, reason)

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking: cancelled,
        refunds: refundResults,
        refundCount: paidPayments.length,
      },
    })
  } catch (error: any) {
    console.error("Cancel booking error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel booking" },
      { status: 500 }
    )
  }
}

