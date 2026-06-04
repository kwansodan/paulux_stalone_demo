export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsGrid from "@/components/dashboard/dashboard-metric-grid"
import ScheduleList from "@/components/dashboard/schedule-list"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { UserRole } from "@generated/prisma/client"

export default async function DashboardPage() {
  await requireRole([UserRole.ADMIN])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const {
    bookings,
    count,
    revenue
  } = await bookingRepository.getAllBookings(
    { bookingDate: today.toISOString().split('T')[0] },
    { includeCount: true, includeRevenue: true }
  )


  // Derive today's pending and confirmed counts from the already date-filtered bookings
  // (countByStatus has no date scope and returns all-time totals)
  const pending = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">

      <DashboardHeader />

      <MetricsGrid
        todaysCount={count ?? 0}
        pending={pending}
        confirmed={confirmed}
        revenue={revenue ?? 0}
      />

      <ScheduleList bookings={bookings} />

    </div>
  )
}
