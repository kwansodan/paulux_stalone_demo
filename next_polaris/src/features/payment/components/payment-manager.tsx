"use client"
import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { usePayments, useCollectPayment } from "../client/use-payment"
import { PaymentsFilters } from "./payment-filters"
import { PaymentFilters, PaymentWithBookingAndService } from "../types"
import { SerializedService } from "@/features/service/types"
import { Loader2 } from "lucide-react"
import { useMarkAsPaid } from "@/features/booking/client/hooks/use-booking"
import RecordPaymentModal from "@/features/booking/components/form/record-payment-modal"
import { calculateBookingTotal } from "@/features/booking/utils/helpers"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 20

// Whether a payment came through a gateway or was recorded manually, and its mode.
function paymentMethod(p: PaymentWithBookingAndService): { mode: string; kind: "Gateway" | "Manual" } {
  if (p.provider === "MANUAL") {
    const mode = p.manualMethod?.name ?? (p.rawPayload as any)?.method ?? "Cash"
    return { mode, kind: "Manual" }
  }
  const channel = (p.rawPayload as any)?.data?.channel
  const mode = channel === "card" ? "Bank Card" : channel === "mobile_money" ? "Mobile Money" : "Paystack"
  return { mode, kind: "Gateway" }
}

export default function PaymentManager({ services }: { services: SerializedService[] }) {
  const [filters, setFilters] = useState<PaymentFilters | null>(null)
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<PaymentWithBookingAndService | null>(null)
  const [page, setPage] = useState(1)

  const { data = [], isLoading } = usePayments(filters ?? {})

  // Reset to the first page whenever the filters change (adjust-state-on-render
  // pattern — avoids a setState-in-effect cascade).
  const filterKey = JSON.stringify(filters ?? {})
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedData = data.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const collectPayment = useCollectPayment()
  const markAsPaid = useMarkAsPaid()

  const columns = [
    {
      key: "bookingId",
      label: "Booking ID",
      render: (p: PaymentWithBookingAndService) => <span className="text-xs font-mono">{p.bookingId}</span>
    },
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
    { key: "service", label: "Service", render: (p: PaymentWithBookingAndService) => p.booking.services.map(s => s.service.name).join(", ") },
    { key: "amount", label: "Deposit paid", render: (p: PaymentWithBookingAndService) => <p className="text-lime-700">{`GHS ${p.amount}`}</p> },
    {
      key: "method",
      label: "Method",
      render: (p: PaymentWithBookingAndService) => {
        const { mode, kind } = paymentMethod(p)
        return (
          <div>
            <p className="font-medium text-gray-900">{mode}</p>
            <p className="text-xs text-gray-500">{kind}</p>
          </div>
        )
      }
    },
    {
      key: "due",
      label: "Amount Due",
      render: (p: PaymentWithBookingAndService) => {
        const totalPaid = p.booking.payments
          .filter(pay => pay.status === "PAID")
          .reduce((sum, pay) => sum + Number(pay.amount), 0)
        const totalPrice = calculateBookingTotal(p.booking)
        const due = totalPrice - totalPaid
        return (
          <p className={due === 0 ? "text-gray-600" : "text-[#D10505]"}>
            {due === 0 ? "Settled" : `GHS ${due.toFixed(2)}`}
          </p>
        )
      }
    },
    { key: "status", label: "Payment status", render: (p: PaymentWithBookingAndService) => p.status },
    {
      key: "createdAt",
      label: "Created At",
      render: (p: PaymentWithBookingAndService) => {
        const d = new Date(p.createdAt)
        return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
      },
    },
    {
      key: "action",
      label: "Action",
      render: (p: PaymentWithBookingAndService) => {
        const isFullyPaid = p.booking.paymentStatus === "PAID"
        const isCollecting = collectPayment.isPending && collectPayment.variables === p.bookingId

        if (isFullyPaid) {
          return (
            <button className="text-gray-600 bg-gray-100 border border-gray-500 rounded-lg px-3 py-1 cursor-not-allowed">
              Collected
            </button>
          )
        }

        return (
          <button
            onClick={() => setRecordPaymentTarget(p)}
            disabled={markAsPaid.isPending}
            className="text-lime-600 bg-[#F9FAFB] border border-lime-700 rounded-lg px-3 py-1 hover:bg-lime-50 flex items-center gap-2"
          >
            {isCollecting && <Loader2 className="w-3 h-3 animate-spin" />}
            + Collect
          </button>
        )
      }
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
        data={pagedData}
        loading={isLoading}
        emptyText="No payments yet"
      />

      <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />

      {recordPaymentTarget && (
        <RecordPaymentModal
          booking={recordPaymentTarget.booking as any}
          open={!!recordPaymentTarget}
          onClose={() => setRecordPaymentTarget(null)}
          onConfirm={(amount, methodId) => {
            markAsPaid.mutate({ id: recordPaymentTarget.bookingId, amount, methodId }, {
              onSuccess: () => setRecordPaymentTarget(null),
            })
          }}
          isPending={markAsPaid.isPending}
        />
      )}
    </div>
  )
}
