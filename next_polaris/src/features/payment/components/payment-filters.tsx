"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { PaymentFilters } from "../types"

export function PaymentsFilters({
  filters,
  setFilters,
  services
}: {
  filters: PaymentFilters | null
  setFilters: (v: any) => void
  services: { id: string; name: string }[]
}) {
  const count = Object.values(filters || {}).filter(Boolean).length

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

      {/* Date Input with Label */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Payment Date</label>
        <Input
          type="date"
          value={filters?.date || ""}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
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