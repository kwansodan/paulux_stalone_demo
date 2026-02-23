import { requireRole } from "@/app/_auth/require-role";
import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { NextRequest, NextResponse } from "next/server";




export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(['ADMIN'])
    if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const bookingId = awaitedParams.id;

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        message: "Booking ID is required"
      })
    }

    const booking = await bookingRepository.findById(bookingId);

    const bookingForResponse = {
      ...booking,
      service: {
        ...booking!.service,
        price: booking!.service.price.toString()
      }
    }

    return NextResponse.json({
      success: true,
      data: bookingForResponse
    }, { status: 200 })

  } catch (error) {
    console.error('Error: getting Booking', error);
    if (error instanceof NextResponse) return error
    return NextResponse.json({
      success: false,
      message: 'Failed to get Booking',
    }, { status: 500 });
  }

}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(['ADMIN'])
    if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const bookingId = awaitedParams.id;

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        message: "Booking ID is required"
      })
    }

    await bookingRepository.deleteById(bookingId);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully"
    }, { status: 200 })

  } catch (error) {
    console.error('Booking delete error:', error);
    if (error instanceof NextResponse) return error
    return NextResponse.json({
      success: false,
      message: 'Failed to delete Booking',
    }, { status: 500 });
  }

}