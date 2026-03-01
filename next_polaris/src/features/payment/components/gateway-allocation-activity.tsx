"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { usePayments } from "../client/use-payment"
import { PaymentFilters, PaymentStatus, PaymentWithBookingAndService } from "../types"

const gatewayLabel: Record<string, string> = {
  PRIMARY_PAYSTACK: "Primary Paystack",
  SECONDARY_PAYSTACK: "Secondary Paystack",
  MANUAL: "Manual",
}

const statusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Completed",
  PARTIAL: "Processing",
  REFUNDED: "Refunded",
  FAILED: "Failed",
}

const ALL_GATEWAYS = "__all__"
const ALL_STATUS = "__all__"

export default function GatewayAllocationActivity() {
  const [filters, setFilters] = useState<PaymentFilters | null>(null)

  const query: Record<string, string> = {}
  if (filters?.search) query.search = filters.search
  if (filters?.gateway) query.gateway = filters.gateway
  if (filters?.status) query.status = filters.status

  const { data = [], isFetching, isLoading } = usePayments(query)

  const activeFilterCount = Object.values({
    gateway: filters?.gateway,
    status: filters?.status,
  }).filter(Boolean).length

  const columns = [
    {
      key: "time",
      label: "Time",
      render: (p: PaymentWithBookingAndService) =>
        new Date(p.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "bookingNumber",
      label: "Booking Number",
      render: (p: PaymentWithBookingAndService) => (
        <span className="text-xs font-mono">{p.booking.bookingReference}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (p: PaymentWithBookingAndService) => {
        let typeStr = "Top up";
        if (p.status === "REFUNDED") {
          typeStr = "Refund";
        } else if (p.booking && p.booking.payments) {
          // Find the earliest payment for this booking
          const earliestPayment = [...p.booking.payments].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];

          if (earliestPayment && earliestPayment.id === p.id) {
            typeStr = "Initial";
          }
        }

        return <span className="text-gray-900 capitalize">{typeStr}</span>;
      },
    },
    {
      key: "customer",
      label: "Customer name",
      render: (p: PaymentWithBookingAndService) => (
        <div>
          <p className="font-semibold">{p.booking.clientName}</p>
          <p className="text-xs text-gray-500 font-normal">{p.booking.clientEmail}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (p: PaymentWithBookingAndService) => (
        <p className="text-gray-900">{`GHS ${Number(p.amount).toFixed(2)}`}</p>
      ),
    },
    {
      key: "allocationGateway",
      label: "Allocation Gateway",
      render: (p: PaymentWithBookingAndService) => (
        <span className="inline-flex items-center rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-700">
          {gatewayLabel[p.provider] ?? p.provider}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p: PaymentWithBookingAndService) => {
        const label = statusLabel[p.status as PaymentStatus] ?? p.status
        const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        const color =
          p.status === "PAID"
            ? "bg-emerald-50 text-emerald-700"
            : p.status === "FAILED"
              ? "bg-rose-50 text-rose-700"
              : p.status === "REFUNDED"
                ? "bg-amber-50 text-amber-700"
                : "bg-sky-50 text-sky-700"

        return <span className={`${base} ${color}`}>{label}</span>
      },
    },
    {
      key: "reason",
      label: "Reason",
      render: (p: PaymentWithBookingAndService) => p.reason || "",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-1 items-end gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Allocation activity</p>
            <Input
              placeholder="Search ref, client or email..."
              value={filters?.search || ""}
              onChange={(e) => setFilters({ ...(filters ?? {}), search: e.target.value })}
              className="h-10 bg-white shadow-none border-[#E2E8F0] rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Gateway</label>
            <Select
              value={filters?.gateway || ALL_GATEWAYS}
              onValueChange={(v) =>
                setFilters({ ...(filters ?? {}), gateway: v === ALL_GATEWAYS ? undefined : v })
              }
            >
              <SelectTrigger className="min-h-10 w-40 bg-white shadow-none border-[#E2E8F0] rounded-lg">
                <SelectValue placeholder="All Gateways" />
              </SelectTrigger>
              <SelectContent className="mt-12">
                <SelectItem value={ALL_GATEWAYS}>All Gateways</SelectItem>
                <SelectItem value="PRIMARY_PAYSTACK">Primary Paystack</SelectItem>
                <SelectItem value="SECONDARY_PAYSTACK">Secondary Paystack</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <Select
              value={filters?.status || ALL_STATUS}
              onValueChange={(v) =>
                setFilters({ ...(filters ?? {}), status: v === ALL_STATUS ? undefined : v })
              }
            >
              <SelectTrigger className="min-h-10 w-40 bg-white shadow-none border-[#E2E8F0] rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="mt-12">
                <SelectItem value={ALL_STATUS}>All Status</SelectItem>
                <SelectItem value="PAID">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIAL">Processing</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({})}
            className="flex items-center gap-1 text-xs text-gray-500 bg-fuchsia-100 px-2 py-1 rounded-lg h-8"
          >
            {activeFilterCount} filters selected <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isFetching || isLoading}
        emptyText="No allocation activity yet"
      />
    </div>
  )
}

