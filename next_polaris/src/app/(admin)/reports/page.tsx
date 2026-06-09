export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import BookingMetrics from "@/features/booking/components/booking-metrics"
import BookingsTable from "@/features/booking/components/booking-table"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { BookingStatus } from "@generated/prisma/enums"
import { UserRole } from "@generated/prisma/client"

export default async function ReportsPage() {
  await requireRole([UserRole.ADMIN], "reports.view")
  // initial fetch (no filters)
  const { bookings, count } = await bookingRepository.getAllBookings(
    {},
    { includeCount: true }
  )

  const metrics = {
    totalBookings: count ?? bookings.length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
    unpaid: bookings.filter(b => b.paymentStatus !== "PAID").length,
    completed: bookings.filter(b => b.status === "COMPLETED").length,
  }

  return (
    <div className="space-y-6 p-6">
      <BookingMetrics initialMetrics={metrics} />
      <BookingsTable />
    </div>
  )
}
