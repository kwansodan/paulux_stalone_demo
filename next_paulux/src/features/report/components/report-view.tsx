"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import DateRangePicker, { buildDatePresets } from "@/components/ui/date-range-picker"
import { downloadCsv, reportFilename, type CsvColumn } from "@/utils/csv"
import { reportsPath } from "@/app/paths"
import type { ReportColumn } from "../types"

type Row = Record<string, any>

function thisMonthRange() {
  return buildDatePresets().find((p) => p.label === "This month")!
}

export default function ReportView({
  slug,
  title,
  endpoint,
  columns,
  summary,
}: {
  slug: string
  title: string
  endpoint: string
  columns: ReportColumn<Row>[]
  summary?: (rows: Row[]) => { label: string; value: string }[]
}) {
  const initial = thisMonthRange()
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)

  const { data: rows = [], isFetching } = useQuery<Row[]>({
    queryKey: ["report", endpoint, from, to],
    queryFn: async () =>
      (await api.get(`/reports/${endpoint}`, { params: { from, to } })).data.data ?? [],
  })

  const tableColumns = columns.map((c) => ({
    key: c.key,
    label: c.label,
    render: (row: Row) => (c.render ? c.render(row) : c.value ? c.value(row) : row[c.key]),
  }))

  const summaryChips = summary && rows.length > 0 ? summary(rows) : []

  function handleDownload() {
    const csvColumns: CsvColumn<Row>[] = columns.map((c) => ({
      header: c.label,
      value: (row) => (c.value ? c.value(row) : row[c.key]),
    }))
    downloadCsv(reportFilename(slug, from, to), csvColumns, rows)
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={reportsPath()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> All reports
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* Filter + export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
        <Button
          onClick={handleDownload}
          disabled={rows.length === 0}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
        >
          <Download className="w-4 h-4 mr-1.5" /> Download CSV
        </Button>
      </div>

      {/* Summary chips */}
      {summaryChips.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {summaryChips.map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={tableColumns}
        data={rows}
        loading={isFetching}
        emptyText="No data for this period"
      />
    </div>
  )
}
