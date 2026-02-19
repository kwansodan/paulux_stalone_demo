import { prisma } from "@/lib/prisma";
import { Booking, BookingStatus, PaymentStatus, Prisma } from "@generated/prisma/client";
import { Booking as BookingPayload } from "../utils/validation";
import { generateBookingReference } from "@/utils/helpers";
import { BookingQueryOptions, BookingQueryResult, BookingWithServiceAndPayment } from "../types";
import { createCalendarEvent } from "@/lib/google-calendar";

export class BookingRepository {

  async upsertBooking(payload: BookingPayload): Promise<Booking> {
    if (payload.id) {
      const existing = await prisma.booking.findUnique({
        where: { id: payload.id }
      })

      if (!existing) {
        throw new Error("Booking not found. Cannot update.")
      }

      return prisma.booking.update({
        where: { id: payload.id },
        data: {
          clientName: payload.clientName,
          clientEmail: payload.clientEmail,
          clientPhone: payload.clientPhone,
          serviceId: payload.serviceId,
          bookingDate: payload.bookingDate,
          bookingTime: payload.bookingTime,
          status: payload.status,
          paymentStatus: payload.paymentStatus ?? PaymentStatus.PENDING,
          createdById: payload.createdById ?? null
        }
      })
    }

    let booking = await prisma.booking.create({
      data: {
        bookingReference: generateBookingReference(),
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        clientPhone: payload.clientPhone,
        serviceId: payload.serviceId,
        bookingDate: payload.bookingDate,
        bookingTime: payload.bookingTime,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdById: payload?.createdById ?? null
      },
      include: {
        service: true
      }
    })

    if (payload.status === BookingStatus.CONFIRMED) {
      // If created as confirmed (e.g. by admin), add to calendar
      try {
        const eventId = await createCalendarEvent(booking);
        if (eventId) {
          booking = await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
            include: { service: true }
          });
        }
      } catch (error) {
        console.error("Failed to create calendar event for new booking:", error);
      }
    }

    return booking;
  }


  async getAllBookings(where?: Prisma.BookingWhereInput, options?: BookingQueryOptions): Promise<BookingQueryResult> {
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!options) {
      return { bookings }
    }

    const queryResult: any = {
      // serialized service.price in booking.service for easier handling on client side
      bookings: bookings.map(b => ({
        ...b,
        service: {
          ...b.service,
          price: b.service.price.toString()
        }
      }))
    };
    if (options.includeCount) {
      queryResult['count'] = bookings.length
    }
    if (options.includeRevenue) {
      const confirmedBookings = bookings.filter(
        b => b.status === BookingStatus.CONFIRMED
      )
      const revenue = confirmedBookings.reduce((sum, b) => sum + Number(b.service.price), 0)
      queryResult['revenue'] = revenue
    }

    return queryResult
  }


  async findById(id: string) {
    const result = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        payments: true,
      },
    })

    return {
      ...result,
      service: {
        ...result?.service,
        price: result?.service.price.toString() ?? "0"
      }
    }
  }

  async findByReference(reference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        service: true,
      },
    })
  }

  async isSlotAvailable(
    date: Date,
    time: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0]
    const dayOfWeek = date.getUTCDay()

    // Get capacity for this day
    const businessHour = await prisma.businessHour.findUnique({
      where: { dayOfWeek },
      select: { maxConcurrentBookings: true }
    })

    if (!businessHour) return false
    const bookingCount = await prisma.booking.count({
      where: {
        bookingDate: dateString,
        bookingTime: time,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        ...(excludeBookingId && {
          id: { not: excludeBookingId },
        }),
      },
    })

    return bookingCount < businessHour.maxConcurrentBookings
  }


  async updateStatus(id: string, status: BookingStatus) {
    let booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: true,
      },
    })

    if (status === BookingStatus.CONFIRMED && !booking.googleEventId) {
      try {
        const eventId = await createCalendarEvent(booking);
        if (eventId) {
          booking = await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
            include: { service: true }
          });
        }
      } catch (error) {
        console.error("Failed to create calendar event on status update:", error);
      }
    }

    return booking;
  }

  async countByStatus(status: BookingStatus) {
    return prisma.booking.count({
      where: { status }
    })
  }


  async cancelBooking(id: string, reason?: string) {
    return prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: reason ?? null,
      },
    })
  }


  async deleteById(id: string) {
    return prisma.booking.delete({
      where: {
        id
      }
    })
  }
}

export const bookingRepository = new BookingRepository();