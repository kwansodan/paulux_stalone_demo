import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus, Prisma } from "@generated/prisma/client"
import { PaymentMetrics } from "../types"
import { BookingStatus } from "@/features/booking/types"

type PaymentDTO = {
  id?: string
  bookingId: string
  provider: PaymentProvider
  providerRef: string
  amount: number
  currency: "GHS"
  status: PaymentStatus
  rawPayload?: unknown
  reason?: string | null
}

export class PaymentRepository {

  getAll(where: Prisma.PaymentWhereInput) {
    return prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            services: { include: { service: true } },
            payments: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  }

  async save(dto: PaymentDTO) {
    let upsertedPayment;
    if (dto.id) {
      const existing = await prisma.payment.findUnique({
        where: { id: dto.id }
      })

      if (!existing) {
        throw new Error("Payment not found. Cannot update.")
      }

      upsertedPayment = await prisma.payment.update({
        where: { id: dto.id },
        data: {
          status: dto.status,
          rawPayload: dto.rawPayload as Prisma.InputJsonValue | undefined,
          amount: dto.amount,
          currency: dto.currency,
        },
      })
    } else {
      upsertedPayment = await prisma.payment.create({
        data: {
          bookingId: dto.bookingId,
          provider: dto.provider,
          providerRef: dto.providerRef,
          amount: dto.amount,
          currency: dto.currency,
          status: dto.status,
          rawPayload: dto.rawPayload as Prisma.InputJsonValue | undefined,
          reason: dto.reason ?? undefined,
        },
      })
    }


    const serializedPayment = {
      ...upsertedPayment,
      amount: upsertedPayment.amount.toString(),
      createdAt: upsertedPayment.createdAt.toISOString(),
      updatedAt: upsertedPayment.updatedAt.toISOString()
    }

    return serializedPayment

  }

  async findByProviderRef(provider: PaymentProvider, ref: string) {
    return prisma.payment.findUnique({
      where: {
        provider_providerRef: {
          provider,
          providerRef: ref,
        },
      },
    })
  }

  async findByBooking(bookingId: string) {
    return prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    })
  }


  async getMetrics(): Promise<PaymentMetrics> {
    const today = new Date()
    const startOfDay = new Date(today.toDateString())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    const [totalDepositsToday, weeklyRevenue] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
          status: {
            in: [PaymentStatus.PAID, PaymentStatus.PARTIAL]
          }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.PAID,
          createdAt: { gte: startOfWeek }
        }
      })
    ])

    const todaysBookings = await prisma.booking.findMany({
      where: {
        bookingDate: today.toISOString().split('T')[0],
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
        }
      },
      include: { services: { include: { service: true } }, payments: true }
    })


    // const filteredBookings = todaysBookings.filter(booking => {
    //   // Check all payments are PAID
    //   if (!booking.payments.every(p => p.status === PaymentStatus.PAID)) {
    //     return false
    //   }

    //   const minDepositAmount = ((booking.minDepositPercent || booking.service.minDepositPercent) / 100) * Number(booking.service.price)

    //   // Check if any payment meets min deposit amount
    //   const anyPaymentMeets = booking.payments.some(p => Number(p.amount) >= minDepositAmount)

    //   if (anyPaymentMeets) return true

    //   // Otherwise check sum of all payments
    //   const sumPayments = booking.payments.reduce((acc, p) => acc + Number(p.amount), 0)
    //   return sumPayments >= minDepositAmount
    // })


    // Get ALL bookings up to today (for totalBalanceDueToday)
    const allBookingsUpToToday = await prisma.booking.findMany({
      where: {
        bookingDate: {
          lte: today.toISOString().split('T')[0]  // On or before today
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING]
        }
      },
      include: { services: { include: { service: true } }, payments: true }
    })

    // Calculate totalBalanceDueToday (all unpaid from day 1 till today)
    let totalBalanceDueToday = 0

    for (const booking of allBookingsUpToToday) {
      const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0)
      const totalPayments = booking.payments
        .filter(p => p.status !== PaymentStatus.REFUNDED)
        .reduce((sum, p) => sum + Number(p.amount), 0)

      const unpaidBalance = totalPrice - totalPayments

      if (unpaidBalance > 0) {
        totalBalanceDueToday += unpaidBalance
      }
    }

    let todaysPendingCollections = 0

    for (const booking of todaysBookings) {
      const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0)
      const totalPayments = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const unpaidBalance = totalPrice - totalPayments

      if (unpaidBalance > 0) {
        todaysPendingCollections++
      }
    }

    return {
      totalDepositsToday: Number(totalDepositsToday._sum.amount ?? 0),
      totalBalanceDueToday: totalBalanceDueToday,
      thisWeeksRevenue: Number(weeklyRevenue._sum.amount ?? 0),
      todaysPendingCollections: todaysPendingCollections
    }
  }

}

export const paymentRepository = new PaymentRepository()
