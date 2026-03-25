import { prisma } from "@/lib/prisma";
import { Booking, BookingStatus, PaymentStatus, Prisma } from "@generated/prisma/client";
import { generateBookingReference, timeToMinutes, minutesToTime } from "@/utils/helpers";
import { BookingQueryOptions, BookingQueryResult, BookingWithServiceAndPayment, BookingWithService } from "../types";
import { createCalendarEvent } from "@/lib/google-calendar";
import { serviceRepository } from "@/features/service/server/service.repository";


export class BookingRepository {

  async upsertBooking(payload: any): Promise<Booking> {
    const serviceIds = payload.serviceIds || (payload.serviceId ? [payload.serviceId] : []);

    // Fetch all services to calculate total price and duration
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (payload.id) {
      const existing = await prisma.booking.findUnique({
        where: { id: payload.id }
      })

      if (!existing) {
        throw new Error("Booking not found. Cannot update.")
      }

      // Update basic fields
      await prisma.booking.update({
        where: { id: payload.id },
        data: {
          clientName: payload.clientName,
          clientEmail: payload.clientEmail,
          clientPhone: payload.clientPhone,
          bookingDate: payload.bookingDate,
          bookingTime: payload.bookingTime,
          status: payload.status,
          paymentStatus: payload.paymentStatus ?? PaymentStatus.PENDING,
          createdById: payload.createdById ?? null
        }
      })

      // Update services (delete and recreate for simplicity in many-to-many)
      if (serviceIds.length > 0) {
        await prisma.bookingService.deleteMany({
          where: { bookingId: payload.id }
        });

        await prisma.bookingService.createMany({
          data: services.map(s => ({
            bookingId: payload.id as string,
            serviceId: s.id,
            priceAtBooking: s.price,
            durationAtBooking: s.durationMinutes
          }))
        });
      }

      return prisma.booking.findUniqueOrThrow({
        where: { id: payload.id },
        include: { services: { include: { service: true } } }
      }) as unknown as Booking;
    }

    let booking = await prisma.booking.create({
      data: {
        bookingReference: generateBookingReference(),
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        clientPhone: payload.clientPhone,
        bookingDate: payload.bookingDate,
        bookingTime: payload.bookingTime,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdById: payload?.createdById ?? null,
        services: {
          create: services.map(s => ({
            serviceId: s.id,
            priceAtBooking: s.price,
            durationAtBooking: s.durationMinutes
          }))
        }
      },
      include: {
        services: { include: { service: true } }
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
            include: { services: { include: { service: true } } }
          });
        }
      } catch (error) {
        console.error("Failed to create calendar event for new booking:", error);
      }
    }

    // Payment is now triggered manually by admin via "Charge Customer" (POS flow)

    return booking;
  }


  async getAllBookings(where?: Prisma.BookingWhereInput, options?: BookingQueryOptions): Promise<BookingQueryResult> {
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        services: {
          include: {
            service: true
          }
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as unknown as BookingWithServiceAndPayment[];

    if (!options) {
      return { bookings }
    }

    const queryResult: any = {
      bookings: bookings
    };
    if (options.includeCount) {
      queryResult['count'] = bookings.length
    }
    if (options.includeRevenue) {
      const activeBookings = bookings.filter(
        b => b.status !== BookingStatus.CANCELLED
      )
      const revenue = activeBookings.reduce((sum, booking) => {
        const bookingTotal = booking.services.reduce((sSum, bs) => sSum + Number(bs.priceAtBooking), 0);
        return sum + bookingTotal;
      }, 0);

      queryResult['revenue'] = revenue
    }

    return queryResult
  }


  async findById(id: string) {
    const result = await prisma.booking.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true
          }
        },
        payments: true,
      },
    })

    if (!result) {
      return null
    }

    return result as unknown as BookingWithServiceAndPayment
  }

  async findByReference(reference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        services: {
          include: {
            service: true
          }
        },
      },
    }) as unknown as BookingWithService
  }

  async isSlotAvailable(
    date: Date,
    time: string,
    durationMinutes: number,
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

    const requestedStart = timeToMinutes(time);
    const requestedEnd = requestedStart + durationMinutes;

    // Fetch all existing bookings for this date to check for overlaps
    const existingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: dateString,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        ...(excludeBookingId && {
          id: { not: excludeBookingId },
        }),
      },
      include: {
        services: true
      }
    });

    // We need to check if at any point within [requestedStart, requestedEnd],
    // the number of active bookings exceeds maxConcurrentBookings.
    // A simple way is to check every 15-minute increment or just checking at start/end of all existing bookings.
    // For simplicity and accuracy with small number of bookings, we'll check the count at each existing booking's start time and the requested start time.

    const checkPoints = new Set<number>();
    checkPoints.add(requestedStart);
    existingBookings.forEach(b => checkPoints.add(timeToMinutes(b.bookingTime)));

    for (const cp of checkPoints) {
      if (cp >= requestedStart && cp < requestedEnd) {
        let concurrentAtCP = 0;

        // Count how many existing bookings overlap this checkpoint
        for (const b of existingBookings) {
          const bStart = timeToMinutes(b.bookingTime);
          const bDuration = b.services.reduce((sum, s) => sum + s.durationAtBooking, 0);
          const bEnd = bStart + bDuration;

          if (cp >= bStart && cp < bEnd) {
            concurrentAtCP++;
          }
        }

        if (concurrentAtCP >= businessHour.maxConcurrentBookings) {
          return false;
        }
      }
    }

    return true;
  }


  async rescheduleBooking(id: string, bookingDate: string, bookingTime: string) {
    return prisma.booking.update({
      where: { id },
      data: {
        bookingDate,
        bookingTime,
      },
      include: {
        services: { include: { service: true } },
        payments: true,
      },
    })
  }


  async updateStatus(id: string, status: BookingStatus) {
    let booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        services: { include: { service: true } },
      },
    })

    if (status === BookingStatus.CONFIRMED && !booking.googleEventId) {
      try {
        const eventId = await createCalendarEvent(booking);
        if (eventId) {
          booking = await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
            include: { services: { include: { service: true } } }
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