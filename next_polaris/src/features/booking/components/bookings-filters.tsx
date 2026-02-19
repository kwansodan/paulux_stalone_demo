"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookingFilters, BookingStatus } from "../types"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { PaymentStatus } from "@/features/payment/types"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"



export default function BookingsFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: BookingFilters
  onChange: (f: Partial<BookingFilters>) => void
  onReset: () => void
}) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "")

  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => {
      if (!value || value === '' || value === 'all') return false
      return true
    })
    .length


  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ search: searchInput || undefined })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleReset = () => {
    setSearchInput("")
    onReset()
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div className="space-y-1">
        <Label className="text-sm font-normal text-foreground">
          Date Range
        </Label>
        <DatePickerWithRange
          value={filters.from && filters.to ? { from: new Date(filters.from), to: new Date(filters.to) } : undefined}
          onChange={(r) => {
            onChange({
              from: r?.from?.toISOString().split("T")[0],
              to: r?.to?.toISOString().split("T")[0],
            })
          }}
        />
      </div>

      {/* Time filter */}
      <div className="space-y-1">
        <Label className="text-sm font-normal text-foreground">
          Time
        </Label>
        <Input
          type="time"
          className="h-12 bg-gray-50 shadow-none border-[#E2E8F0] rounded-lg w-full"
          value={filters.time ?? ""}
          onChange={(e) =>
            onChange({ time: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-normal text-foreground">
          Search
        </Label>
        <Input
          placeholder="Name, email, phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-12 bg-gray-50 shadow-none border-[#E2E8F0] rounded-lg w-full"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-normal text-foreground">
          Status
        </Label>
        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ status: v === "all" ? undefined : (v as BookingStatus) })}

        >
          <SelectTrigger className="min-h-12  bg-gray-50 shadow-none border-[#E2E8F0] rounded-lg w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="mt-12">
            <SelectItem value="all">All</SelectItem>
            {Object.values(BookingStatus).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <div className="space-y-1">
        <Label className="text-sm font-normal text-foreground">
          Payment
        </Label>
        <Select value={filters.paymentStatus} onValueChange={(v) => onChange({ paymentStatus: v === "all" ? undefined : (v as PaymentStatus) })}>
          <SelectTrigger className="min-h-12  bg-gray-50 shadow-none border-[#E2E8F0] rounded-lg w-full">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="mt-12">
            <SelectItem value="all">All</SelectItem>
            {Object.values(PaymentStatus).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilters > 0 && (<div className="flex items-end pb-1">
        <Button variant="ghost" className="h-10 p-2 text-xs sm:text-sm text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={handleReset}>
          {activeFilters} filters ×
        </Button>
      </div>)}
    </div>
  )
}
