import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import StylistJobs from "@/features/staff/components/stylist-jobs"

export const dynamic = "force-dynamic"

export default async function StylistTodayPage() {
  const user = await requireRole([UserRole.STAFF])
  const todayStr = new Date().toISOString().split("T")[0]

  const { bookings } = await bookingRepository.getAllBookings({
    bookingDate: todayStr,
    OR: [
      { assignedToId: user.id },
      { services: { some: { assignedToId: user.id } } },
    ],
  } as any)

  // Chronological by appointment time for the day.
  const sorted = [...bookings].sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
  const active = sorted.filter((b) => b.status !== "CANCELLED")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Today&apos;s jobs</h1>
        <p className="text-sm text-gray-500">
          {new Date(todayStr + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          {" · "}{active.length} job{active.length === 1 ? "" : "s"}
        </p>
      </div>
      <StylistJobs bookings={sorted} stylistId={user.id} emptyText="No jobs assigned to you for today." />
    </div>
  )
}
