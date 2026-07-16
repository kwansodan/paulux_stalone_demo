import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import Link from "next/link"
import { REPORTS, REPORT_GROUPS } from "@/features/report/registry"
import { reportPath } from "@/app/paths"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  await requireRole([UserRole.ADMIN], "reports.view")

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-600">
          Open a report to filter by date range and download a CSV.
        </p>
      </div>

      {REPORT_GROUPS.map((group) => {
        const items = REPORTS.filter((r) => r.group === group)
        if (items.length === 0) return null
        return (
          <div key={group} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{group}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((r) => {
                const Icon = r.icon
                return (
                  <Link
                    key={r.slug}
                    href={reportPath(r.slug)}
                    className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-fuchsia-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-fuchsia-700">{r.title}</p>
                      <p className="text-sm text-gray-500">{r.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
