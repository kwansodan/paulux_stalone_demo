import Link from "next/link"
import { Boxes, ArrowRight } from "lucide-react"
import { materialUsageReportPath } from "@/app/paths"
import { SectionUsageReport } from "@/features/material/types"

/**
 * Compact material-cost summary for the Reports page. Presentational and
 * server-rendered. Renders nothing when there's no data (e.g. before the
 * materials migration is applied, or no issuances yet) so it never clutters
 * the report or breaks if the feature isn't set up.
 */
export default function MaterialCostSummary({
  report,
  periodLabel,
}: {
  report: SectionUsageReport | null
  periodLabel: string
}) {
  if (!report || report.sections.length === 0) return null

  const ghs = (n: number) => `GHS ${n.toFixed(2)}`
  const topSections = report.sections.slice(0, 5)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-fuchsia-50 text-fuchsia-600">
            <Boxes className="w-4 h-4" />
          </span>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">Material cost by section</p>
            <p className="text-xs text-gray-500">{periodLabel}</p>
          </div>
        </div>
        <Link
          href={materialUsageReportPath()}
          className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700"
        >
          Full report <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex items-baseline justify-between border-b border-gray-100 pb-3 mb-3">
        <span className="text-sm text-gray-500">Total this period</span>
        <span className="text-xl font-bold text-gray-900">{ghs(report.grandTotal)}</span>
      </div>

      <ul className="space-y-2">
        {topSections.map((s) => {
          const pct = report.grandTotal > 0 ? (s.totalCost / report.grandTotal) * 100 : 0
          return (
            <li key={s.sectionId ?? s.sectionName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.sectionName}</span>
                <span className="font-medium text-gray-900">{ghs(s.totalCost)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
