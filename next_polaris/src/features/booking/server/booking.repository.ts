import { prisma } from "@/lib/prisma";
import { Booking, BookingStatus, PaymentStatus, Prisma } from "@generated/prisma/client";
import { Booking as BookingPayload } from "../utils/validation";
import { generateBookingReference } from "@/utils/helpers";
import { BookingQueryOptions, BookingQueryResult } from "../types";

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

    return prisma.booking.create({
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
      }
    })
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
    return prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
      },
    })
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
    serviceId: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0]
    const existingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: dateString,
        bookingTime: time,
        serviceId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        ...(excludeBookingId && {
          id: { not: excludeBookingId },
        }),
      },
    })

    return !existingBooking
  }


  async updateStatus(id: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: true,
      },
    })
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