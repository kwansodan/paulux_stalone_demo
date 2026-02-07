import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus } from "@generated/prisma/client"
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
  rawPayload?: any
}

export class PaymentRepository {

  getAll(where: any) {
    return prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            service: true,
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
          rawPayload: dto.rawPayload,
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
          rawPayload: dto.rawPayload,
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

    const [totalDeposits, weeklyRevenue] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID }
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
        bookingDate: today.toDateString(),
        status: BookingStatus.CONFIRMED,
      },
      include: { service: true, payments: true }
    })

    const filteredBookings = todaysBookings.filter(booking => {
      // Check all payments are PAID
      if (!booking.payments.every(p => p.status === PaymentStatus.PAID)) {
        return false
      }

      const minDepositAmount = (booking.service.minDepositPercent / 100) * Number(booking.service.price)

      // Check if any payment meets min deposit amount
      const anyPaymentMeets = booking.payments.some(p => Number(p.amount) >= minDepositAmount)

      if (anyPaymentMeets) return true

      // Otherwise check sum of all payments
      const sumPayments = booking.payments.reduce((acc, p) => acc + Number(p.amount), 0)
      return sumPayments >= minDepositAmount
    })

    let balanceDueToday = 0
    let pendingCollections = 0

    for (const b of filteredBookings) {
      const deposit = b.payments.reduce((s, p) => s + Number(p.amount), 0)
      const total = Number(b.service.price)
      const balance = total - deposit

      if (balance > 0) {
        balanceDueToday += balance
        pendingCollections++
      }
    }

    return {
      totalDeposits: Number(totalDeposits._sum.amount ?? 0),
      totalBalanceDueToday: balanceDueToday,
      thisWeeksRevenue: Number(weeklyRevenue._sum.amount ?? 0),
      todaysPendingCollections: pendingCollections
    }
  }

}

export const paymentRepository = new PaymentRepository()
