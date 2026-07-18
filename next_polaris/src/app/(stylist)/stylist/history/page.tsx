import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import StylistJobs from "@/features/staff/components/stylist-jobs"

export const dynamic = "force-dynamic"

export default async function StylistHistoryPage() {
  const user = await requireRole([UserRole.STAFF])

  const { bookings } = await bookingRepository.getAllBookings({
    OR: [
      { assignedToId: user.id },
      { services: { some: { assignedToId: user.id } } },
    ],
  } as any)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Job history</h1>
        <p className="text-sm text-gray-500">Every job you&apos;ve been assigned to.</p>
      </div>
      <StylistJobs bookings={bookings} stylistId={user.id} emptyText="No jobs yet." />
    </div>
  )
}
