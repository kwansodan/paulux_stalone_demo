import { requireRoleApi } from "@/app/_auth/require-role-api";
import { authRepository } from "@/features/auth/server/auth.repository";
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { isPastSlot } from "@/features/booking/utils/helpers";
import { BookingSchema } from "@/features/booking/utils/validation";
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository";
import { serviceRepository } from "@/features/service/server/service.repository";
import { isTime24HoursInAdvance, isTimeWithinRange } from "@/utils/helpers";
import { BookingStatus, PaymentStatus, Prisma, UserRole } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";




export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleApi(['ADMIN'])
    if (!auth.ok) return auth.response


    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date')
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const search = searchParams.get("search")
    const time = searchParams.get("time")

    const query: Prisma.BookingWhereInput = {};

    if (date) {
      query.bookingDate = date
    }

    if (from || to) {
      query.bookingDate = {}
      if (from) query.bookingDate.gte = from
      if (to) query.bookingDate.lte = to
    }

    if (time) {
      query.bookingTime = time
    }

    if (status) {
      query.status = status as BookingStatus
    }

    if (paymentStatus) {
      query.payments = {
        some: {
          status: paymentStatus as PaymentStatus,
        },
      }
    }


    if (search) {
      query.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search } },
      ]
    }

    const bookings = await bookingRepository.getAllBookings(query)

    return NextResponse.json({
      success: true,
      message: `Successfully queried all bookings`,
      data: bookings
    }, { status: 200 })
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    console.error("Error getting all bookings: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to get all bookings" }, { status: 500 })
  }

}

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const validatedBody = BookingSchema.parse(body)

    // Authorization check for updates
    if (validatedBody.id) {
      const auth = await requireRoleApi(['ADMIN'])
      if (!auth.ok) return auth.response
    }

    if (validatedBody.createdById) {
      const existingUser = await authRepository.findUserById(validatedBody.createdById)
      if (!existingUser || existingUser.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Invalid createdById provided' },
          { status: 409 })
      }
    }

    //  validate that body contains valid serviceIds 
    const serviceIds = validatedBody.serviceIds || (validatedBody.serviceId ? [validatedBody.serviceId] : []);

    if (serviceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one serviceId must be provided' },
        { status: 400 })
    }

    const existingServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (existingServices.length !== serviceIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more invalid serviceIds provided' },
        { status: 409 })
    }

    const totalDuration = existingServices.reduce((sum, s) => sum + s.durationMinutes, 0);

    // check if date is blocked
    const blocked = await blockedDateRepository.findByDate(
      new Date(validatedBody.bookingDate).toString()
    )

    if (blocked) {
      return NextResponse.json(
        { success: false, error: "Selected date is blocked" },
        { status: 409 }
      )
    }


    const bookingDateObj = new Date(validatedBody.bookingDate)
    const dayOfWeek = bookingDateObj.getUTCDay() // 0-6

    const businessHour = await businessHourRepository.findByDayOfWeek(dayOfWeek)

    if (!businessHour || !businessHour.isOpen) {
      return NextResponse.json(
        { success: false, error: "Business is closed on this day" },
        { status: 409 }
      )
    }

    if (
      !isTimeWithinRange(
        validatedBody.bookingTime,
        businessHour.startTime,
        businessHour.endTime
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking time is outside business hours"
        },
        { status: 409 }
      )
    }

    if (isPastSlot(
      new Date(validatedBody.bookingDate),
      validatedBody.bookingTime
    )) {
      return NextResponse.json(
        { success: false, error: "Selected time is already in the past" },
        { status: 409 }
      )
    }

    // Check if booking is at least 24 hours in advance
    // if (!isTime24HoursInAdvance(
    //   new Date(validatedBody.bookingDate),
    //   validatedBody.bookingTime
    // )) {
    //   return NextResponse.json(
    //     { success: false, error: "Booking must be made at least 24 hours in advance" },
    //     { status: 409 }
    //   )
    // }


    // check if booking already exists for chosen date or time
    const isAvailable = await bookingRepository.isSlotAvailable(
      new Date(validatedBody.bookingDate),
      validatedBody.bookingTime,
      totalDuration,
      validatedBody.id
    )

    if (!isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Booking already exists for slot (overlap detected)' },
        { status: 409 })
    }

    const createdBooking = await bookingRepository.upsertBooking({
      ...validatedBody,
    })



    return NextResponse.json({ success: true, message: "Successfully created booking!", data: createdBooking }, { status: 200 })
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    console.error("Error creating booking: ", error)
    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { success: false, message: "Invalid data provided" },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message = "Database operation failed"

      if (error.code === "P2002") {
        const target = error.meta?.["target"]

        if (Array.isArray(target) && target.length > 0) {
          message = `${target[0]} already exists`
        } else {
          message = "Unique constraint violated"
        }
      } else if (error.code === "P2025") {
        message = "Record not found"
      } else if (error.code === "P2003") {
        message = "Invalid reference to related record"
      }

      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      )
    }

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, message: error.message || "Failed to create booking" }, { status: 500 })
  }
}