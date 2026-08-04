"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGetUsageReport } from "@/features/material/client/use-materials"
import { materialsPath } from "@/app/paths"
import { ArrowLeft, Download } from "lucide-react"

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function UsageReportShell() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [from, setFrom] = useState(isoDate(monthStart))
  const [to, setTo] = useState(isoDate(now))

  const { data: report, isLoading } = useGetUsageReport(from, to)

  const ghs = (n: number) => `GHS ${n.toFixed(2)}`

  const csv = useMemo(() => {
    if (!report) return ""
    const rows: string[] = ["Section,Material,Unit,Quantity,Cost (GHS)"]
    for (const s of report.sections) {
      for (const l of s.lines) {
        rows.push(`"${s.sectionName}","${l.materialName}",${l.unit},${l.quantity},${l.cost.toFixed(2)}`)
      }
    }
    rows.push("")
    rows.push(`Grand total,,,,"${report.grandTotal.toFixed(2)}"`)
    return rows.join("\n")
  }, [report])

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `material-cost-${from}_to_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={materialsPath()} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-2">
          <ArrowLeft className="w-4 h-4" /> Materials
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Material cost by section</h1>
        <p className="text-sm text-gray-500">What each section consumed in materials over the selected period.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 p-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">From</Label>
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600">To</Label>
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-10" />
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={downloadCsv} disabled={!report || report.sections.length === 0}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Grand total */}
      {report && (
        <div className="flex items-center justify-between rounded-2xl bg-fuchsia-50 border border-fuchsia-100 px-5 py-4">
          <span className="text-sm font-medium text-fuchsia-900">Total material cost (all sections)</span>
          <span className="text-xl font-bold text-fuchsia-700">{ghs(report.grandTotal)}</span>
        </div>
      )}

      {/* Sections */}
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
      ) : !report || report.sections.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No material was issued in this period.</p>
      ) : (
        <div className="space-y-4">
          {report.sections.map((s) => (
            <div key={s.sectionId ?? s.sectionName} className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{s.sectionName}</p>
                <p className="text-sm font-bold text-gray-900">{ghs(s.totalCost)}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-4 py-2 font-medium">Material</th>
                    <th className="px-4 py-2 font-medium text-right">Quantity</th>
                    <th className="px-4 py-2 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {s.lines.map((l) => (
                    <tr key={l.materialId} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-800">{l.materialName}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{l.quantity} {l.unit}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{ghs(l.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
