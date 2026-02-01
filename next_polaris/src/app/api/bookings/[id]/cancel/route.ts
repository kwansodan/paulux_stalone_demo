import { NextRequest, NextResponse } from "next/server"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { CancelBookingSchema } from "@/features/booking/utils/validation"
import { BookingStatus } from "@generated/prisma/client"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

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

    const cancelled = await bookingRepository.cancelBooking(bookingId, reason)

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      data: cancelled,
    })
  } catch (error: any) {
    console.error("Cancel booking error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel booking" },
      { status: 500 }
    )
  }
}
