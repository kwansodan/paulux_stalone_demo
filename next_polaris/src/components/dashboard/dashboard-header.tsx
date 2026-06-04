import DashboardDateFilter from "./dashboard-date-filter"
import { Suspense } from "react"

type Props = {
  isToday: boolean
  dateLabel: string
}

export default function DashboardHeader({ isToday, dateLabel }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isToday
            ? "Welcome back! Here’s what’s happening today."
            : `Viewing data for ${dateLabel}`}
        </p>
      </div>

      <Suspense>
        <DashboardDateFilter />
      </Suspense>
    </div>
  )
}
