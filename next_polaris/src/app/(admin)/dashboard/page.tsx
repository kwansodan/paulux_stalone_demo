export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsGrid from "@/components/dashboard/dashboard-metric-grid"
import ScheduleList from "@/components/dashboard/schedule-list"
import RevenueBreakdown from "@/components/dashboard/revenue-breakdown"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus, UserRole } from "@generated/prisma/client"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  await requireRole([UserRole.ADMIN])

  const { date: dateParam } = await searchParams

  // Resolve selected date from URL param, default to today
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? new Date(dateParam + "T00:00:00")
    : new Date()
  selectedDate.setHours(0, 0, 0, 0)

  const tomorrow = new Date(selectedDate)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr = new Date().toISOString().split("T")[0]
  const selectedStr = selectedDate.toISOString().split("T")[0]
  const isToday = selectedStr === todayStr
  const dateLabel = selectedDate.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const [{ bookings, count, revenue }, receivedPayments, bookedServices] = await Promise.all([
    // Bookings where the service is on the selected date
    bookingRepository.getAllBookings(
      { bookingDate: selectedStr },
      { includeCount: true, includeRevenue: true }
    ),
    // Cash received on the selected date (payment.createdAt)
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: selectedDate, lt: tomorrow },
      },
      select: { amount: true, provider: true, rawPayload: true },
    }),
    // Bookings created on the selected date (any future service date)
    prisma.bookingService.findMany({
      where: {
        booking: {
          createdAt: { gte: selectedDate, lt: tomorrow },
          status: { not: "CANCELLED" },
        },
      },
      select: { priceAtBooking: true, quantity: true },
    }),
  ])

  // Metric card counts — scoped to today's bookings
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  const activeCount = (count ?? bookings.length) - cancelled

  // Cash received — broken down by payment method
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

  // Discounts applied on today's bookings
  const discounts = bookings.reduce(
    (sum, b) => sum + (b.discountAmount ? Number(b.discountAmount) : 0),
    0
  )

  // Value of new bookings created on the selected date (any future service date)
  const bookedTodayValue = bookedServices.reduce(
    (sum, s) => sum + Number(s.priceAtBooking) * (s.quantity ?? 1),
    0
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full space-y-6">

      <DashboardHeader isToday={isToday} dateLabel={dateLabel} />

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
