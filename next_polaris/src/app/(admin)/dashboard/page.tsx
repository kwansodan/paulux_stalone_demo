export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsGrid from "@/components/dashboard/dashboard-metric-grid"
import ScheduleList from "@/components/dashboard/schedule-list"
import RevenueBreakdown from "@/components/dashboard/revenue-breakdown"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus, UserRole } from "@generated/prisma/client"

export default async function DashboardPage() {
  await requireRole([UserRole.ADMIN])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr = today.toISOString().split('T')[0]

  const [{ bookings, count, revenue }, todayPayments] = await Promise.all([
    bookingRepository.getAllBookings(
      { bookingDate: todayStr },
      { includeCount: true, includeRevenue: true }
    ),
    // Payments actually received today (by payment creation date)
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: today, lt: tomorrow },
      },
      select: { amount: true, provider: true, rawPayload: true },
    }),
  ])

  // Metric card counts
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  const activeCount = (count ?? bookings.length) - cancelled

  // Revenue breakdown by payment method
  let cash = 0, momo = 0, card = 0

  for (const p of todayPayments) {
    const amount = Number(p.amount)
    if (p.provider === PaymentProvider.MANUAL) {
      cash += amount
    } else {
      // Paystack — check channel from rawPayload if available
      const channel = (p.rawPayload as any)?.data?.channel ?? "mobile_money"
      if (channel === "card") {
        card += amount
      } else {
        momo += amount
      }
    }
  }

  // Total discounts given on today's bookings
  const discounts = bookings.reduce(
    (sum, b) => sum + (b.discountAmount ? Number(b.discountAmount) : 0),
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
        />
        <ScheduleList bookings={bookings} />
      </div>

    </div>
  )
}
