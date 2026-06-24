import { requireRoleApi } from "@/app/_auth/require-role-api";
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { isPastSlot } from "@/features/booking/utils/helpers";
import { BookingSchema } from "@/features/booking/utils/validation";
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository";
import { serviceRepository } from "@/features/service/server/service.repository";
import { isTime24HoursInAdvance, isTimeWithinRange } from "@/utils/helpers";
import { BookingStatus, PaymentStatus, Prisma } from "@generated/prisma/client";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";

class SlotUnavailableError extends Error {
  constructor() {
    super("Booking already exists for slot (overlap detected)")
  }
}




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

    let isWalkIn = validatedBody.bookingType === "WALKIN"
    const isEditing = !!validatedBody.id

    // If updating, retrieve the existing booking to ensure we use the correct bookingType,
    // and keep a snapshot of its prior services/products/date/time so we can tell the
    // customer what actually changed (rather than re-sending a "booking received" message).
    let previousBooking: Awaited<ReturnType<typeof bookingRepository.findById>> = null
    if (isEditing) {
      const auth = await requireRoleApi(['ADMIN'])
      if (!auth.ok) return auth.response

      previousBooking = await bookingRepository.findById(validatedBody.id!)
      if (!previousBooking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }
      isWalkIn = previousBooking.bookingType === "WALKIN"
      validatedBody.bookingType = previousBooking.bookingType
      // Don't trust a client-supplied createdById — use the actual authenticated admin.
      if (validatedBody.createdById) {
        validatedBody.createdById = auth.user.id
      }
    } else if (isWalkIn) {
      // Walk-in bookings are admin-only
      const auth = await requireRoleApi(['ADMIN'])
      if (!auth.ok) return auth.response
      // Don't trust a client-supplied createdById — use the actual authenticated admin.
      validatedBody.createdById = auth.user.id
    } else if (validatedBody.createdById) {
      // A scheduled booking attributed to an admin (booked on a customer's behalf) must
      // itself be made by an authenticated admin — otherwise anyone who knows/guesses an
      // admin's UUID could spoof "Booked by: Admin" attribution on their own booking.
      const auth = await requireRoleApi(['ADMIN'])
      if (!auth.ok) return auth.response
      validatedBody.createdById = auth.user.id
    }

    // For scheduled bookings, require date and time
    if (!isWalkIn) {
      if (!validatedBody.bookingDate) {
        return NextResponse.json({ success: false, error: 'bookingDate is required' }, { status: 400 })
      }
      if (!validatedBody.bookingTime) {
        return NextResponse.json({ success: false, error: 'bookingTime is required' }, { status: 400 })
      }
      if (!validatedBody.clientName || validatedBody.clientName.trim().length < 2) {
        return NextResponse.json({ success: false, error: 'clientName is required' }, { status: 400 })
      }
      if (!validatedBody.clientEmail) {
        return NextResponse.json({ success: false, error: 'clientEmail is required' }, { status: 400 })
      }
    }

    // Auto-fill walk-in date/time (today + current time) — only on creation.
    // On edits, the walk-in's original date/time should be left as-is.
    if (isWalkIn && !validatedBody.id) {
      const now = new Date()
      validatedBody.bookingDate = now.toISOString().split('T')[0]
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      validatedBody.bookingTime = `${hh}:${mm}`
      if (!validatedBody.clientName || validatedBody.clientName.trim() === '') {
        validatedBody.clientName = 'Walk-in Guest'
      }
      if (!validatedBody.clientEmail || validatedBody.clientEmail.trim() === '') {
        validatedBody.clientEmail = ''
      }
    }

    // If packageId provided, expand to the package's service IDs
    // Normalise service entries — support both legacy string[] and new { id, quantity }[]
    let resolvedServiceEntries: { id: string; quantity: number }[] = (
      validatedBody.serviceIds ?? (validatedBody.serviceId ? [validatedBody.serviceId] : [])
    ).map((s) =>
      typeof s === 'string' ? { id: s, quantity: 1 } : { id: s.id, quantity: s.quantity ?? 1 }
    )
    let packageId: string | undefined = validatedBody.packageId

    if (packageId) {
      const pkg = await prisma.servicePackage.findUnique({
        where: { id: packageId },
        include: { services: true },
      })
      if (!pkg) {
        return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 })
      }
      if (!pkg.isActive) {
        return NextResponse.json({ success: false, error: "Package is no longer available" }, { status: 409 })
      }
      resolvedServiceEntries = pkg.services.map((ps) => ({ id: ps.serviceId, quantity: 1 }))
    }

    const serviceIds = resolvedServiceEntries.map(e => e.id)

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

    if (!isWalkIn) {
      // check if date is blocked
      const blocked = await blockedDateRepository.findByDate(
        new Date(validatedBody.bookingDate!).toString()
      )

      if (blocked) {
        return NextResponse.json(
          { success: false, error: "Selected date is blocked" },
          { status: 409 }
        )
      }

      const bookingDateObj = new Date(validatedBody.bookingDate!)
      const dayOfWeek = bookingDateObj.getUTCDay()

      const businessHour = await businessHourRepository.findByDayOfWeek(dayOfWeek)

      if (!businessHour || !businessHour.isOpen) {
        return NextResponse.json(
          { success: false, error: "Business is closed on this day" },
          { status: 409 }
        )
      }

      if (!isTimeWithinRange(validatedBody.bookingTime!, businessHour.startTime, businessHour.endTime)) {
        return NextResponse.json(
          { success: false, error: "Booking time is outside business hours" },
          { status: 409 }
        )
      }

      if (isPastSlot(new Date(validatedBody.bookingDate!), validatedBody.bookingTime!)) {
        return NextResponse.json(
          { success: false, error: "Selected time is already in the past" },
          { status: 409 }
        )
      }

      // check if booking already exists for chosen date or time
      const isAvailable = await bookingRepository.isSlotAvailable(
        new Date(validatedBody.bookingDate!),
        validatedBody.bookingTime!,
        totalDuration,
        validatedBody.id,
        serviceIds,   // plain string[] — slot check doesn't need quantities
      )

      if (!isAvailable) {
        return NextResponse.json(
          { success: false, error: 'Booking already exists for slot (overlap detected)' },
          { status: 409 })
      }
    }

    // Validate promo code server-side (re-check to prevent client tampering)
    let verifiedPromoCodeId: string | null = null
    let verifiedDiscountAmount: number | null = null

    if (validatedBody.promoCodeId) {
      const promo = await prisma.promoCode.findUnique({ where: { id: validatedBody.promoCodeId } })
      const isValid =
        promo &&
        promo.isActive &&
        (!promo.expiresAt || promo.expiresAt > new Date()) &&
        (promo.maxUses === null || promo.usedCount < promo.maxUses)

      if (isValid && promo) {
        // Use client-supplied discountAmount but cap it at bookingTotal
        const bookingTotal = existingServices.reduce((sum, s) => sum + Number(s.price), 0)
        const discountValue = Number(promo.discountValue)
        let computedDiscount =
          promo.discountType === "PERCENTAGE"
            ? Math.min(bookingTotal * (discountValue / 100), bookingTotal)
            : Math.min(discountValue, bookingTotal)
        computedDiscount = Math.round(computedDiscount * 100) / 100

        verifiedPromoCodeId = promo.id
        verifiedDiscountAmount = computedDiscount
      }
    }

    // On edit, only touch promo code fields if the request actually supplied one —
    // otherwise leave any existing promo on the booking untouched.
    const promoFields =
      !validatedBody.id || validatedBody.promoCodeId
        ? { promoCodeId: verifiedPromoCodeId, discountAmount: verifiedDiscountAmount }
        : {}

    const bookingPayload = {
      ...validatedBody,
      serviceIds: resolvedServiceEntries,
      packageId: packageId ?? null,
      termsAcceptedAt: validatedBody.termsAccepted ? new Date() : null,
      ...promoFields,
      bookingType: validatedBody.bookingType ?? "SCHEDULED",
      // Walk-ins are immediately confirmed
      ...(isWalkIn && { status: "CONFIRMED" }),
    }

    // Walk-ins don't contend for slot capacity, so they can be created directly.
    // Scheduled bookings re-check availability one more time inside a transaction that
    // holds a per-date advisory lock — the earlier isAvailable check above is only a fast
    // fail; without this second, lock-guarded check, two concurrent requests for the same
    // near-capacity slot could both pass the first check and both get created.
    const createdBooking = isWalkIn
      ? await bookingRepository.upsertBooking(bookingPayload)
      : await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${validatedBody.bookingDate}))`

          const stillAvailable = await bookingRepository.isSlotAvailable(
            new Date(validatedBody.bookingDate!),
            validatedBody.bookingTime!,
            totalDuration,
            validatedBody.id,
            serviceIds,
            tx,
          )

          if (!stillAvailable) {
            throw new SlotUnavailableError()
          }

          return bookingRepository.upsertBooking(bookingPayload, tx)
        })

    // Only consume a promo use once the booking has actually been persisted —
    // incrementing beforehand would burn a redemption slot on a request that ultimately fails.
    if (verifiedPromoCodeId) {
      await prisma.promoCode.update({
        where: { id: verifiedPromoCodeId },
        data: { usedCount: { increment: 1 } },
      }).catch(err => console.error("Failed to increment promo code usedCount:", err))
    }

    if (!isEditing) {
      await inngest.send({
        name: "app/booking.booking-created",
        data: { bookingId: createdBooking.id }
      }).catch(err => console.error("Failed to send booking-created event:", err))
    } else if (previousBooking) {
      await inngest.send({
        name: "app/booking.booking-updated",
        data: {
          bookingId: createdBooking.id,
          previousServices: previousBooking.services.map(s => ({
            id: s.serviceId,
            name: s.service.name,
            quantity: (s as any).quantity ?? 1,
          })),
          previousProducts: (previousBooking.products ?? []).map(p => ({
            id: p.productId,
            name: p.product.name,
            quantity: p.quantity ?? 1,
          })),
          previousBookingDate: previousBooking.bookingDate,
          previousBookingTime: previousBooking.bookingTime,
        }
      }).catch(err => console.error("Failed to send booking-updated event:", err))
    }

    return NextResponse.json({ success: true, message: "Successfully created booking!", data: createdBooking }, { status: 200 })
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    if (error instanceof SlotUnavailableError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, message: error.message || "Failed to create booking" }, { status: 500 })
  }
}