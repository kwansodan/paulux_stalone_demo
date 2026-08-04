"use client"

import { useRouter, useSearchParams } from "next/navigation"
import DateRangePicker, { buildDatePresets } from "@/components/ui/date-range-picker"

export default function DashboardDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const todayStr = buildDatePresets()[0].from // "Today" preset from value
  const from = searchParams.get("from") ?? todayStr
  const to   = searchParams.get("to")   ?? todayStr

  function handleChange(f: string, t: string) {
    router.push(`?from=${f}&to=${t}`)
  }

  return (
    <DateRangePicker
      from={from}
      to={to}
      onChange={handleChange}
    />
  )
}
