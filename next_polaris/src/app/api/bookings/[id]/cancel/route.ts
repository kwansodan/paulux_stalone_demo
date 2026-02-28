import { NextRequest, NextResponse } from "next/server"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { CancelBookingSchema } from "@/features/booking/utils/validation"
import { BookingStatus, PaymentProvider } from "@generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { initiateRefund } from "@/lib/paystack"
import { inngest } from "@/lib/inngest"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Find all PAID payments for this booking (Both Primary and Secondary)
    const paidPayments = await prisma.payment.findMany({
      where: {
        bookingId: bookingId,
        status: 'PAID',
        provider: {
          in: [PaymentProvider.PRIMARY_PAYSTACK, PaymentProvider.SECONDARY_PAYSTACK]
        },
      },
    })

    const refundResults: any[] = []

    // Initiate refunds for all paid Paystack payments
    for (const payment of paidPayments) {
      try {
        console.log(`Initiating refund for payment ${payment.id}, reference: ${payment.providerRef} (${payment.provider})`)

        const refundResponse = await initiateRefund(
          payment.providerRef,
          undefined, // Full refund
          `Booking cancelled: ${reason || 'No reason provided'}`,
          'Your booking has been cancelled and a refund has been initiated.',
          payment.provider as PaymentProvider
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

    await inngest.send({
      name: "app/booking.booking-cancel",
      data: {
        bookingId: bookingId
      }
    }).then((data) => console.log("BOOKING EVENT SENT", data)).catch((error) => console.log("ERROR SENDING BOOKING EVENT", error))

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

