export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import BookingMetrics from "@/features/booking/components/booking-metrics"
import BookingsTable from "@/features/booking/components/booking-table"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { materialRepository } from "@/features/material/server/material.repository"
import MaterialCostSummary from "@/features/material/components/material-cost-summary"
import { SectionUsageReport } from "@/features/material/types"
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

  // Current-month material cost by section. Guarded so the Reports page still
  // renders if the materials tables aren't migrated yet.
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  let materialReport: SectionUsageReport | null = null
  try {
    materialReport = await materialRepository.getUsageBySection(monthStart, now)
  } catch {
    materialReport = null
  }
  const periodLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6 p-6">
      <BookingMetrics initialMetrics={metrics} />
      <MaterialCostSummary report={materialReport} periodLabel={periodLabel} />
      <BookingsTable />
    </div>
  )
}
