"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { PaymentFilters } from "../types"
import DateRangePicker from "@/components/ui/date-range-picker"

export function PaymentsFilters({
  filters,
  setFilters,
  services
}: {
  filters: PaymentFilters | null
  setFilters: (v: any) => void
  services: { id: string; name: string }[]
}) {
  const count = [filters?.search, filters?.serviceId, filters?.from, filters?.gateway, filters?.status].filter(Boolean).length

  return (
    <div className="flex items-end gap-3">
      <Input
        placeholder="Search for customer by name or email"
        value={filters?.search || ""}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Service </label>
        <Select
          value={filters?.serviceId || ""}
          onValueChange={(v) => setFilters({ ...filters, serviceId: v })}
        >
          <SelectTrigger className="min-h-12 w-48 bg-white shadow-none border-[#E2E8F0] rounded-lg">
            <SelectValue placeholder="Service type" />
          </SelectTrigger>
          <SelectContent className="mt-12">
            {services.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range picker */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Period</label>
        <DateRangePicker
          from={filters?.from || ""}
          to={filters?.to || ""}
          onChange={(from, to) => setFilters({ ...filters, from, to })}
          placeholder="All time"
        />
      </div>

      {count > 0 && (
        <button
          onClick={() => setFilters({})}
          className="flex items-center gap-1 text-sm text-gray-500 bg-fuchsia-100 px-2 py-1 rounded-lg h-12"
        >
          {count} filters selected <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}