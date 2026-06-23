import { prisma } from "@/lib/prisma";
import { Booking, BookingStatus, PaymentStatus, Prisma } from "@generated/prisma/client";
import { generateBookingReference, timeToMinutes } from "@/utils/helpers";
import { BookingQueryOptions, BookingQueryResult, BookingWithServiceAndPayment, BookingWithService } from "../types";
import { createCalendarEvent } from "@/lib/google-calendar";
import { bookingInclude } from "@/lib/prisma-includes";
import { calculateBookingTotal } from "../utils/helpers";


export class BookingRepository {

  async upsertBooking(payload: any, client?: Prisma.TransactionClient): Promise<Booking> {
    const db = client ?? prisma

    // Normalise service entries — accept both legacy string[] and new { id, quantity }[]
    const serviceEntries: { id: string; quantity: number }[] = (
      payload.serviceIds || (payload.serviceId ? [payload.serviceId] : [])
    ).map((s: string | { id: string; quantity: number }) =>
      typeof s === 'string' ? { id: s, quantity: 1 } : s
    );
    const serviceIds = serviceEntries.map(s => s.id);

    const productEntries: { id: string; quantity: number }[] = (payload.productIds ?? []).map(
      (p: string | { id: string; quantity: number }) =>
        typeof p === 'string' ? { id: p, quantity: 1 } : p
    );
    const productIds = productEntries.map(p => p.id);

    // Fetch all services to get price and duration snapshots
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } }
    });

    // Fetch all products to get price snapshot
    const products = productIds.length > 0
      ? await db.product.findMany({ where: { id: { in: productIds } } })
      : [];

    if (payload.id) {
      const existing = await db.booking.findUnique({
        where: { id: payload.id }
      })

      if (!existing) {
        throw new Error("Booking not found. Cannot update.")
      }

      // Update basic fields
      await db.booking.update({
        where: { id: payload.id },
        data: {
          clientName: payload.clientName,
          clientEmail: payload.clientEmail,
          clientPhone: payload.clientPhone,
          bookingDate: payload.bookingDate,
          bookingTime: payload.bookingTime,
          status: payload.status,
          paymentStatus: payload.paymentStatus ?? PaymentStatus.PENDING,
          createdById: payload.createdById ?? null,
          // Only touch promo code fields if a promo was applied during this edit —
          // avoids clobbering an existing promo when the edit form doesn't surface one.
          ...(payload.promoCodeId !== undefined && {
            promoCodeId: payload.promoCodeId,
            discountAmount: payload.discountAmount ?? null,
          }),
        }
      })

      // Snapshot what was already on the booking before we touch it — edits should only
      // affect the price of items actually being added, not re-price everything else at
      // today's catalog price. Stylist assignments must also survive the edit.
      const existingBookingServices = await db.bookingService.findMany({ where: { bookingId: payload.id } })
      const existingBookingProducts = await db.bookingProduct.findMany({ where: { bookingId: payload.id } })

      // Update services (delete and recreate)
      if (serviceIds.length > 0) {
        await db.bookingService.deleteMany({ where: { bookingId: payload.id } });
        await db.bookingService.createMany({
          data: services.map(s => {
            const existingRow = existingBookingServices.find(e => e.serviceId === s.id)
            return {
              bookingId: payload.id as string,
              serviceId: s.id,
              priceAtBooking: existingRow?.priceAtBooking ?? s.price,
              durationAtBooking: existingRow?.durationAtBooking ?? s.durationMinutes,
              quantity: serviceEntries.find(e => e.id === s.id)?.quantity ?? 1,
              assignedToId: existingRow?.assignedToId ?? null,
            }
          })
        });
      }

      // Update products (delete and recreate)
      await db.bookingProduct.deleteMany({ where: { bookingId: payload.id } });
      if (products.length > 0) {
        await db.bookingProduct.createMany({
          data: products.map(p => {
            const existingRow = existingBookingProducts.find(e => e.productId === p.id)
            return {
              bookingId: payload.id as string,
              productId: p.id,
              priceAtBooking: existingRow?.priceAtBooking ?? p.price,
              quantity: productEntries.find(e => e.id === p.id)?.quantity ?? 1,
            }
          })
        });
      }

      // Return the full canonical shape
      return db.booking.findUniqueOrThrow({
        where: { id: payload.id },
        include: bookingInclude,
      }) as unknown as Booking;
    }

    let booking = await db.booking.create({
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
        termsAcceptedAt: payload.termsAcceptedAt ?? null,
        packageId: payload.packageId ?? null,
        promoCodeId: payload.promoCodeId ?? null,
        discountAmount: payload.discountAmount ?? null,
        bookingType: payload.bookingType ?? "SCHEDULED",
        services: {
          create: services.map(s => ({
            serviceId: s.id,
            priceAtBooking: s.price,
            durationAtBooking: s.durationMinutes,
            quantity: serviceEntries.find(e => e.id === s.id)?.quantity ?? 1,
          }))
        },
        ...(products.length > 0 && {
          products: {
            create: products.map(p => ({
              productId: p.id,
              priceAtBooking: p.price,
              quantity: productEntries.find(e => e.id === p.id)?.quantity ?? 1,
            }))
          }
        }),
      },
      include: bookingInclude,
    })

    if (payload.status === BookingStatus.CONFIRMED) {
      // If created as confirmed (e.g. by admin), add to calendar
      try {
        const eventId = await createCalendarEvent(booking);
        if (eventId) {
          booking = await db.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
            include: bookingInclude,
          });
        }
      } catch (error) {
        console.error("Failed to create calendar event for new booking:", error);
      }
    }

    return booking as unknown as Booking;
  }


  async getAllBookings(where?: Prisma.BookingWhereInput, options?: BookingQueryOptions): Promise<BookingQueryResult> {
    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    }) as unknown as BookingWithServiceAndPayment[];

    if (!options) {
      return { bookings }
    }

    const queryResult: any = { bookings };
    if (options.includeCount) {
      queryResult['count'] = bookings.length
    }
    if (options.includeRevenue) {
      const activeBookings = bookings.filter(b => b.status !== BookingStatus.CANCELLED)
      // Sum service value of today's bookings — this is revenue earned by delivering services today
      queryResult['revenue'] = activeBookings.reduce((sum, booking) => {
        return sum + calculateBookingTotal(booking);
      }, 0);
    }

    return queryResult
  }


  /**
   * Returns a { "YYYY-MM-DD": count } map of active (non-cancelled) bookings per day,
   * for rendering calendar density hints. Inclusive of both bounds.
   */
  async getBookingCountsByDateRange(from: string, to: string): Promise<Record<string, number>> {
    const grouped = await prisma.booking.groupBy({
      by: ['bookingDate'],
      where: {
        bookingDate: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELLED },
      },
      _count: { _all: true },
    })

    return grouped.reduce((acc, row) => {
      acc[row.bookingDate] = row._count._all
      return acc
    }, {} as Record<string, number>)
  }

  async findById(id: string) {
    const result = await prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    })

    if (!result) return null

    return result as unknown as BookingWithServiceAndPayment
  }

  async findByReference(reference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: bookingInclude,
    }) as unknown as BookingWithService
  }

  async isSlotAvailable(
    date: Date,
    time: string,
    durationMinutes: number,
    excludeBookingId?: string,
    serviceIds?: string[],
    client?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const db = client ?? prisma
    const dateString = date.toISOString().split('T')[0]
    const dayOfWeek = date.getUTCDay()

    const businessHour = await db.businessHour.findUnique({
      where: { dayOfWeek },
      select: { maxConcurrentBookings: true }
    })

    if (!businessHour) return false

    const requestedStart = timeToMinutes(time);
    const requestedEnd = requestedStart + durationMinutes;

    const baseWhere = {
      bookingDate: dateString,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] as BookingStatus[] },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
    }

    // Fetch all existing bookings for this date (minimal include — only for slot calc)
    const existingBookings = await db.booking.findMany({
      where: baseWhere,
      include: { services: true },
    });

    const checkPoints = new Set<number>();
    checkPoints.add(requestedStart);
    existingBookings.forEach(b => checkPoints.add(timeToMinutes(b.bookingTime)));

    // --- Global capacity check ---
    for (const cp of checkPoints) {
      if (cp >= requestedStart && cp < requestedEnd) {
        let concurrentAtCP = 0;
        for (const b of existingBookings) {
          const bStart = timeToMinutes(b.bookingTime);
          const bEnd = bStart + b.services.reduce((sum, s) => sum + s.durationAtBooking, 0);
          if (cp >= bStart && cp < bEnd) concurrentAtCP++;
        }
        if (concurrentAtCP >= businessHour.maxConcurrentBookings) return false;
      }
    }

    // --- Per-category capacity check ---
    if (serviceIds && serviceIds.length > 0) {
      const requestedServices = await db.service.findMany({
        where: { id: { in: serviceIds } },
        include: { category: true },
      });

      const categoryMap = new Map<string, { id: string; capacity: number }>();
      for (const svc of requestedServices) {
        if (svc.category) {
          categoryMap.set(svc.category.id, { id: svc.category.id, capacity: svc.category.capacity });
        }
      }

      for (const [categoryId, category] of categoryMap) {
        const categoryBookings = await db.booking.findMany({
          where: {
            ...baseWhere,
            services: { some: { service: { categoryId } } },
          },
          include: { services: true },
        });

        const catCheckPoints = new Set<number>();
        catCheckPoints.add(requestedStart);
        categoryBookings.forEach(b => catCheckPoints.add(timeToMinutes(b.bookingTime)));

        for (const cp of catCheckPoints) {
          if (cp >= requestedStart && cp < requestedEnd) {
            let concurrentAtCP = 0;
            for (const b of categoryBookings) {
              const bStart = timeToMinutes(b.bookingTime);
              const bEnd = bStart + b.services.reduce((sum, s) => sum + s.durationAtBooking, 0);
              if (cp >= bStart && cp < bEnd) concurrentAtCP++;
            }
            if (concurrentAtCP >= category.capacity) return false;
          }
        }
      }
    }

    return true;
  }


  async rescheduleBooking(id: string, bookingDate: string, bookingTime: string) {
    return prisma.booking.update({
      where: { id },
      data: { bookingDate, bookingTime },
      include: bookingInclude,
    })
  }


  async updateStatus(id: string, status: BookingStatus) {
    let booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: bookingInclude,
    })

    if (status === BookingStatus.CONFIRMED && !booking.googleEventId) {
      try {
        const eventId = await createCalendarEvent(booking);
        if (eventId) {
          booking = await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
            include: bookingInclude,
          });
        }
      } catch (error) {
        console.error("Failed to create calendar event on status update:", error);
      }
    }

    return booking;
  }

  async countByStatus(status: BookingStatus) {
    return prisma.booking.count({ where: { status } })
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
    return prisma.booking.delete({ where: { id } })
  }
}

export const bookingRepository = new BookingRepository();
