export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsGrid from "@/components/dashboard/dashboard-metric-grid"
import ScheduleList from "@/components/dashboard/schedule-list"
import RevenueBreakdown from "@/components/dashboard/revenue-breakdown"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus, UserRole } from "@generated/prisma/client"

function fmt(d: Date) {
  return d.toISOString().split("T")[0]
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requireRole([UserRole.ADMIN])

  const { from: fromParam, to: toParam } = await searchParams

  const todayStr = fmt(new Date())
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  const fromStr = fromParam && dateRegex.test(fromParam) ? fromParam : todayStr
  const toStr   = toParam   && dateRegex.test(toParam)   ? toParam   : todayStr

  // Start of fromStr date, end of toStr date
  const fromDate = new Date(fromStr + "T00:00:00")
  const toDateEnd = new Date(toStr + "T00:00:00")
  toDateEnd.setDate(toDateEnd.getDate() + 1) // exclusive upper bound

  const [{ bookings, count, revenue }, receivedPayments, bookedServices] = await Promise.all([
    // Bookings where the service falls within the selected range
    bookingRepository.getAllBookings(
      { bookingDate: { gte: fromStr, lte: toStr } },
      { includeCount: true, includeRevenue: true }
    ),
    // Payments received within the selected range
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: fromDate, lt: toDateEnd },
      },
      select: { amount: true, provider: true, rawPayload: true },
    }),
    // New bookings created within the selected range (any future service date)
    prisma.bookingService.findMany({
      where: {
        booking: {
          createdAt: { gte: fromDate, lt: toDateEnd },
          status: { not: "CANCELLED" },
        },
      },
      select: { priceAtBooking: true, quantity: true },
    }),
  ])

  // Metric counts
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  const activeCount = (count ?? bookings.length) - cancelled

  // Cash received breakdown by payment method
  let cash = 0, momo = 0, card = 0

  for (const p of receivedPayments) {
    const amount = Number(p.amount)
    if (p.provider === PaymentProvider.MANUAL) {
      cash += amount
    } else {
      const channel = (p.rawPayload as any)?.data?.channel ?? "mobile_money"
      if (channel === "card") {
        card += amount
      } else {
        momo += amount
      }
    }
  }

  // Discounts applied on bookings in the range
  const discounts = bookings.reduce(
    (sum, b) => sum + (b.discountAmount ? Number(b.discountAmount) : 0),
    0
  )

  // Value of new bookings created within the range
  const bookedTodayValue = bookedServices.reduce(
    (sum, s) => sum + Number(s.priceAtBooking) * (s.quantity ?? 1),
    0
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full space-y-6">

      <DashboardHeader />

      <MetricsGrid
        todaysCount={activeCount}
        pending={pending}
        confirmed={confirmed}
        cancelled={cancelled}
        revenue={revenue ?? 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueBreakdown
          cash={cash}
          momo={momo}
          card={card}
          discounts={discounts}
          bookedTodayValue={bookedTodayValue}
        />
        <ScheduleList bookings={bookings} />
      </div>

    </div>
  )
}
