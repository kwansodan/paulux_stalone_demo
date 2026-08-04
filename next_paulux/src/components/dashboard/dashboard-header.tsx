import DashboardDateFilter from "./dashboard-date-filter"
import { Suspense } from "react"

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>
      <Suspense>
        <DashboardDateFilter />
      </Suspense>
    </div>
  )
}
