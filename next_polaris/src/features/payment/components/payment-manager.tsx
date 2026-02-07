"use client"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { usePayments } from "../client/use-payment"
import { PaymentsFilters } from "./payment-filters"
import { PaymentFilters, PaymentWithBookingAndService } from "../types"
import { SerializedService } from "@/features/service/types"

export default function PaymentManager({ services }: { services: SerializedService[] }) {
  const [filters, setFilters] = useState<PaymentFilters|null>(null)

  const { data = [], isLoading } = usePayments(filters??{})

  const columns = [
    {
      key: "customer",
      label: "Customer name",
      render: (p: PaymentWithBookingAndService) => (
        <div>
          <p className="font-semibold">{p.booking.clientName}</p>
          <p className="text-xs text-gray-500 font-normal">{p.booking.clientEmail}</p>
        </div>
      )
    },
    { key: "service", label: "Service", render: (p: PaymentWithBookingAndService) => p.booking.service.name },
    { key: "amount", label: "Deposit paid", render: (p: PaymentWithBookingAndService) => <p className="text-lime-700">{`GHS ${p.amount}`}</p> },
    { key: "due", label: "Amount Due", render: (p: PaymentWithBookingAndService) => <p className={(Number(p.booking.service.price) - Number(p.amount)) === 0? "text-gray-600": "text-[#D10505]"}>
      {(Number(p.booking.service.price) - Number(p.amount)) === 0? "Settled":`GHS ${(Number(p.booking.service.price) - Number(p.amount)).toFixed(2)}`}
      </p>},
    { key: "status", label: "Payment status", render: (p: PaymentWithBookingAndService) => p.status },
    { key: "createdAt", label: "Created At", render: (p: PaymentWithBookingAndService) => new Date(p.createdAt).toDateString() },
    {
      key: "action",
      label: "Action",
      render: (p: PaymentWithBookingAndService) =>
        p.status !== "PAID" ? (
          <button className="text-lime-600 bg-[#F9FAFB] border border-lime-700 rounded-lg px-3 py-1">+ Collect</button>
        ) : (
          <button className="text-gray-600 bg-gray-100 border border-gray-500 rounded-lg px-3 py-1 cursor-not-allowed">Collected</button>
        )
    }
  ]

  return (
    <div className="space-y-4">
      <PaymentsFilters
        filters={filters}
        setFilters={setFilters}
        services={services}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        emptyText="No payments yet"
      />
    </div>
  )
}
