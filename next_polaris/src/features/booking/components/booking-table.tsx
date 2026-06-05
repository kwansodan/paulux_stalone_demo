"use client"

import { useMemo, useState } from "react"
import BookingsFilters from "./bookings-filters"
import { BookingFilters, BookingWithServiceAndPayment } from "../types"
import { DataTable } from "@/components/data-table"
import { useBookings, useChargeCustomer, useMarkAsPaid } from "../client/hooks/use-booking"
import { Button } from "@/components/ui/button"
import { Banknote, Scissors } from "lucide-react"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"
import { calculateBookingTotal } from "../utils/helpers"
import ChargeCustomerModal from "./form/charge-customer-modal"
import AssignStylistModal from "./form/assign-stylist-modal"
import RecordPaymentModal from "./form/record-payment-modal"

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
  const [chargeBooking, setChargeBooking] = useState<BookingWithServiceAndPayment | null>(null)
  const [assignBooking, setAssignBooking] = useState<BookingWithServiceAndPayment | null>(null)
  const [recordPaymentBooking, setRecordPaymentBooking] = useState<BookingWithServiceAndPayment | null>(null)
  const chargeCustomer = useChargeCustomer()
  const markAsPaid = useMarkAsPaid()

  const apiFilters = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all' && value !== '') {
        acc[key as keyof BookingFilters] = value
      }
      return acc
    }, {} as Partial<BookingFilters>)
  }, [filters])

  const { data, isLoading } = useBookings(apiFilters)
  const columns = [
    { key: "bookingReference", label: "Order number" },
    { key: "clientName", label: "Customer" },
    {
      key: "bookedBy",
      label: "Booked by",
      render: (row: BookingWithServiceAndPayment) => {
        const isWalkIn = row.bookingType === "WALKIN"
        if (isWalkIn) {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Walk-in
            </span>
          )
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.createdById ? "bg-fuchsia-100 text-fuchsia-700" : "bg-blue-50 text-blue-700"}`}>
            {row.createdById ? "Admin" : "Customer"}
          </span>
        )
      }
    },
    {
      key: "stylist",
      label: "Stylist",
      render: (row: BookingWithServiceAndPayment) => (
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
          {row.assignedTo ? (
            <span className="text-sm text-gray-800">{row.assignedTo.username}</span>
          ) : (
            <span className="text-sm text-gray-400 italic">Unassigned</span>
          )}
        </div>
      )
    },
    {
      key: "services",
      label: "Service(s)",
      render: (row: BookingWithServiceAndPayment) => (
        <div className="flex flex-col gap-0.5">
          {row.services.map(s => (
            <span key={s.serviceId} className="text-sm">{s.service.name}</span>
          ))}
        </div>
      )
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
      render: (row: BookingWithServiceAndPayment) => {
        const total = calculateBookingTotal(row);
        return `GHS ${total.toFixed(2)}`;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: BookingWithServiceAndPayment) => {
        const paymentStatus = calculatePaymentStatus(row)
        const isUnpaidOrPartial = ['PENDING', 'PARTIAL', 'FAILED'].includes(paymentStatus)
        const isWalkIn = row.bookingType === "WALKIN"
        const isActive = !['CANCELLED', 'COMPLETED'].includes(row.status)

        return (
          <div className="flex items-center gap-1.5">
            {/* Assign stylist button — always shown for active bookings */}
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                onClick={() => setAssignBooking(row)}
              >
                <Scissors className="w-3.5 h-3.5 mr-1" />
                {row.assignedTo ? "Reassign" : "Assign"}
              </Button>
            )}

            {/* Cash button — walk-ins only, when unpaid */}
            {isActive && isUnpaidOrPartial && isWalkIn && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                disabled={markAsPaid.isPending}
                onClick={() => setRecordPaymentBooking(row)}
              >
                <Banknote className="w-3.5 h-3.5 mr-1" />
                Cash
              </Button>
            )}

            {/* Charge button */}
            {isActive && isUnpaidOrPartial && (!isWalkIn || row.clientEmail) && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100"
                onClick={() => setChargeBooking(row)}
              >
                Charge
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <>
      {chargeBooking && (
        <ChargeCustomerModal
          booking={chargeBooking}
          open={!!chargeBooking}
          onClose={() => setChargeBooking(null)}
          onConfirm={(amount) => chargeCustomer.mutate({ id: chargeBooking.id, amount })}
          isPending={chargeCustomer.isPending}
        />
      )}
      {assignBooking && (
        <AssignStylistModal
          booking={assignBooking}
          open={!!assignBooking}
          onClose={() => setAssignBooking(null)}
        />
      )}
      {recordPaymentBooking && (
        <RecordPaymentModal
          booking={recordPaymentBooking}
          open={!!recordPaymentBooking}
          onClose={() => setRecordPaymentBooking(null)}
          onConfirm={(amount) => {
            markAsPaid.mutate({ id: recordPaymentBooking.id, amount }, {
              onSuccess: () => setRecordPaymentBooking(null),
            })
          }}
          isPending={markAsPaid.isPending}
        />
      )}
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
    </>
  )
}
