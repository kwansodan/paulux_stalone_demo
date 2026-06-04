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


  // Derive today's counts from the already date-filtered bookings
  const pending = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  // Today's bookings excludes cancelled so the count reflects active bookings
  const activeCount = (count ?? bookings.length) - cancelled

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">

      <DashboardHeader />

      <MetricsGrid
        todaysCount={activeCount}
        pending={pending}
        confirmed={confirmed}
        cancelled={cancelled}
        revenue={revenue ?? 0}
      />

      <ScheduleList bookings={bookings} />

    </div>
  )
}
