"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const dateParam = searchParams.get("date")
  const selectedDate = dateParam
    ? new Date(dateParam + "T00:00:00")
    : new Date()

  const todayStr = new Date().toISOString().split("T")[0]
  const selectedStr = selectedDate.toISOString().split("T")[0]
  const isToday = selectedStr === todayStr

  function navigate(delta: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    router.push(`?date=${d.toISOString().split("T")[0]}`)
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) router.push(`?date=${e.target.value}`)
  }

  const label = selectedDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>

      {/* Date display — clicking opens the native date picker */}
      <label className="relative flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
        <CalendarDays className="w-4 h-4 text-fuchsia-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{label}</span>
        <input
          type="date"
          value={selectedStr}
          onChange={handleDateChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        />
      </label>

      <button
        onClick={() => navigate(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>

      {!isToday && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("?")}
          className="h-9 text-xs text-fuchsia-600 border-fuchsia-200 hover:bg-fuchsia-50"
        >
          Today
        </Button>
      )}
    </div>
  )
}
