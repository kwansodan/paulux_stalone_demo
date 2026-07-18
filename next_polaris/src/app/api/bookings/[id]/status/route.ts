import { NextRequest, NextResponse } from "next/server"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { BookingStatusSchema } from "@/features/booking/utils/validation"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { reconcileBookingProductStock } from "@/features/product/server/product-stock.service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "bookings.view")
    if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const bookingId = awaitedParams.id
    const body = await request.json()
    const { status } = BookingStatusSchema.parse(body)

    const booking = await bookingRepository.findById(bookingId)

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status === status) {
      return NextResponse.json(
        { success: false, error: "Booking status cannot be set to the same status" },
        { status: 409 }
      )
    }

    const updated = await bookingRepository.updateStatus(bookingId, status)

    // Sync product stock to the new status: deduct on CONFIRMED/COMPLETED,
    // restore on CANCELLED (idempotent).
    await reconcileBookingProductStock(bookingId).catch((err) =>
      console.error("Failed to reconcile product stock on status change:", err)
    )

    return NextResponse.json({
      success: true,
      message: "Booking status updated successfully",
      data: updated,
    })
  } catch (error: any) {
    console.error("Booking status error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update booking status" },
      { status: 500 }
    )
  }
}
