"use client"

import { useMemo, useState } from "react"
import BookingsFilters from "./bookings-filters"
import { BookingFilters, BookingWithServiceAndPayment } from "../types"
import { DataTable } from "@/components/data-table"
import { useBookings, useChargeCustomer } from "../client/hooks/use-booking"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"

const initialFilters: BookingFilters = {
  from: undefined,
  to: undefined,
  status: 'all',
  paymentStatus: 'all',
  search: undefined,
  time: undefined
}

export default function BookingsTable() {
  const [filters, setFilters] = useState<BookingFilters>(initialFilters)
  const chargeCustomer = useChargeCustomer()
  // remove 'all' values and empty strings before sending to API
  const apiFilters = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all' && value !== '') {
        acc[key as keyof BookingFilters] = value
      }
      return acc
    }, {} as Partial<BookingFilters>)
  }, [filters])

  console.log("API Filters", apiFilters)
  console.log("UI Filters", filters)

  const { data, isLoading } = useBookings(apiFilters)
  const columns = [
    { key: "bookingReference", label: "Order number" },
    { key: "clientName", label: "Customer" },
    {
      key: "bookedBy",
      label: "Booked by",
      render: (row: BookingWithServiceAndPayment) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.createdById ? "bg-fuchsia-100 text-fuchsia-700" : "bg-blue-50 text-blue-700"}`}>
          {row.createdById ? "Admin" : "Customer"}
        </span>
      )
    },
    {
      key: "service.name",
      label: "Service",
      render: (row: BookingWithServiceAndPayment) => row.service.name
    },
    { key: "bookingDate", label: "Date" },
    { key: "bookingTime", label: "Time" },
    {
      key: "status", label: "Status",
      render: (row: BookingWithServiceAndPayment) => <span
        className={`px-2 py-1 rounded-full text-xs
        ${row.status === "CONFIRMED" && "bg-lime-50 text-lime-700 border-lime-700"}
        ${row.status === "PENDING" && "bg-gray-100 text-[#E17100] border border-[#E17100]"}
        ${row.status === "CANCELLED" && "bg-red-50 text-[#D10505] border-[#D10505]"}
        `}
      >
        {row.status}
      </span>
    },
    {
      key: "payment.status",
      label: "Payment",
      render: (row: BookingWithServiceAndPayment) => {
        const payment = row.payments?.[0]
        return payment ? (
          <span
            className={`px-2 py-1 rounded-full text-xs
              ${payment.status === "PAID" && "bg-gray-100 text-gray-700"}
              ${payment.status === "PENDING" && "bg-gray-100 text-[#E17100] border border-[#E17100]"}
              ${payment.status === "REFUNDED" && "bg-gray-50 text-gray-700 border-gray-200"}
              ${payment.status === "FAILED" && "bg-red-50 text-[#D10505] border-[#D10505]"}
        `}
          >
            {payment.status}
          </span>
        ) : "No payment"
      }
    },
    {
      key: "amount",
      label: "Amount",
      render: (row: BookingWithServiceAndPayment) => `GHS ${Number(row.service.price).toFixed(2)}`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: BookingWithServiceAndPayment) => {
        const paymentStatus = calculatePaymentStatus(row)
        const isUnpaidOrPartial = ['PENDING', 'PARTIAL', 'FAILED'].includes(paymentStatus)

        if (row.status === "CANCELLED" || row.status === "COMPLETED") return null
        if (!isUnpaidOrPartial) return null

        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100"
            disabled={chargeCustomer.isPending}
            onClick={() => chargeCustomer.mutate(row.id)}
          >
            {chargeCustomer.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Charge
          </Button>
        )
      }
    }
  ]


  return (
    <div className="space-y-4">
      <div className="max-h-50 overflow-y-auto w-full space-y-4 p-6 rounded-lg border border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Filters</h1>
          <p className="text-sm text-gray-500">
            Narrow down your report data
          </p>
        </div>
        <BookingsFilters
          filters={filters}
          onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
          onReset={() => setFilters(initialFilters)}
        />
      </div>

      <div className="max-h-165 overflow-y-auto w-full space-y-4 p-6 rounded-lg border border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">All Bookings</h1>
          <p className="text-sm text-gray-500">
            {data?.length || 0} {data?.length === 1 ? "record" : "records"} found
          </p>
        </div>

        <DataTable
          loading={isLoading}
          data={data || []}
          emptyText="No bookings found"
          columns={columns}
        />
      </div>
    </div>
  )
}
