"use client"

import MetricCard from "@/components/metric-card"
import { Button } from "@/components/ui/button"
import { Users, XCircle, Clock, CheckCircle, UploadIcon, Loader } from "lucide-react"
import { IBookingMetrics } from "../types"
import { useBookingMetrics } from "../client/hooks/use-booking"
import { useExportBookings } from "../client/hooks/use-export-bookings"

export default function BookingMetrics({
  initialMetrics,
}: {
  initialMetrics: IBookingMetrics
}) {
  const { data } = useBookingMetrics(initialMetrics)
  const { exportBookings, isExporting } = useExportBookings()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-gray-500">Generate and export business reports</p>
        </div>
        <Button
          variant="outline"
          className="h-12 shadow-none"
          onClick={() => exportBookings()}
          disabled={isExporting}
        >
          {isExporting? <Loader className="h-4 w-4 mr-2 animate-spin" />:<UploadIcon className="h-4 w-4 mr-2" />}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total bookings" value={data.totalBookings} icon={<Users />} />
        <MetricCard title="Cancelled" value={data.cancelled} icon={<XCircle />} />
        <MetricCard title="Unpaid" value={data.unpaid} icon={<Clock />} />
        <MetricCard title="Completed bookings" value={data.completed} icon={<CheckCircle />} />
      </div>
    </div>
  )
}
