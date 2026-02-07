import BookingMetrics from "@/features/booking/components/booking-metrics"
import BookingsTable from "@/features/booking/components/booking-table"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { BookingStatus } from "@generated/prisma/enums"

export default async function ReportsPage() {
  // initial fetch (no filters)
  const { bookings, count } = await bookingRepository.getAllBookings(
    {},
    { includeCount: true }
  )

  const confirmedBookings = bookings.filter(
    b => b.status === BookingStatus.CONFIRMED
  )

  const metrics = {
    totalBookings: count ?? bookings.length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
    unpaid: bookings.length - confirmedBookings.length,
    completed: bookings.filter(b => b.status === "COMPLETED").length,
  }

  return (
    <div className="space-y-6 p-6">
      <BookingMetrics initialMetrics={metrics} />
      <BookingsTable  />
    </div>
  )
}
