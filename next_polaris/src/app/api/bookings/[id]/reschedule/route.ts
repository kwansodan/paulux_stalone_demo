import { NextRequest, NextResponse } from "next/server"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository"
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository"
import { serviceRepository } from "@/features/service/server/service.repository"
import { isPastSlot } from "@/features/booking/utils/helpers"
import { BookingInputSchema } from "@/features/booking/utils/validation"
import { isTime24HoursInAdvance, isTimeWithinRange } from "@/utils/helpers"
import { BookingStatus } from "@generated/prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params
    const bookingId = awaitedParams.id

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      )
    }

    const existingBooking = await bookingRepository.findById(bookingId)

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      )
    }

    if (existingBooking.status === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, message: "Cancelled bookings cannot be rescheduled" },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = BookingInputSchema.pick({
      bookingDate: true,
      bookingTime: true,
      serviceId: true,
    }).parse({
      ...body,
      serviceId: existingBooking.serviceId,
    })

    const bookingDateObj = new Date(parsed.bookingDate)
    const dayOfWeek = bookingDateObj.getUTCDay()

    const blocked = await blockedDateRepository.findByDate(
      new Date(parsed.bookingDate).toString()
    )
    if (blocked) {
      return NextResponse.json(
        { success: false, message: "Selected date is blocked" },
        { status: 409 }
      )
    }

    const businessHour = await businessHourRepository.findByDayOfWeek(dayOfWeek)
    if (!businessHour || !businessHour.isOpen) {
      return NextResponse.json(
        { success: false, message: "Business is closed on this day" },
        { status: 409 }
      )
    }

    const service = await serviceRepository.findById(existingBooking.serviceId)
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service no longer exists" },
        { status: 409 }
      )
    }

    if (
      !isTimeWithinRange(
        parsed.bookingTime,
        businessHour.startTime,
        businessHour.endTime
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking time is outside business hours",
        },
        { status: 409 }
      )
    }

    if (isPastSlot(bookingDateObj, parsed.bookingTime)) {
      return NextResponse.json(
        { success: false, message: "Selected time is already in the past" },
        { status: 409 }
      )
    }

    if (!isTime24HoursInAdvance(bookingDateObj, parsed.bookingTime)) {
      return NextResponse.json(
        {
          success: false,
          message: "Reschedule must be at least 24 hours before the appointment",
        },
        { status: 409 }
      )
    }

    const available = await bookingRepository.isSlotAvailable(
      bookingDateObj,
      parsed.bookingTime,
      bookingId
    )

    if (!available) {
      return NextResponse.json(
        { success: false, message: "Selected slot is no longer available" },
        { status: 409 }
      )
    }

    const updated = await bookingRepository.rescheduleBooking(
      bookingId,
      parsed.bookingDate,
      parsed.bookingTime
    )

    return NextResponse.json({
      success: true,
      message: "Booking rescheduled successfully",
      data: updated,
    })
  } catch (error: any) {
    console.error("Reschedule booking error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to reschedule booking",
      },
      { status: 500 }
    )
  }
}

