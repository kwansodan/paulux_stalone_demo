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
    { bookingDate: today.toDateString() },
    { includeCount: true, includeRevenue: true }
  )

  const pending =
    await bookingRepository.countByStatus("PENDING")

  const confirmed =
    await bookingRepository.countByStatus("CONFIRMED")

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
