'use client'
import Modal from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import CreateBookingForm from "./form/create-booking-form";
import { SerializedService } from "@/features/service/types";
import { SerializedProduct } from "@/features/product/types";
import { User } from "@generated/prisma/client";
import { BookingFilter, PaymentFilter } from "./booking-client-shell";

export default function BookingHeader({
  services,
  products,
  authenticatedUser,
  selectedBookingFilter,
  setSelectedBookingFilter,
  selectedPaymentFilter,
  setSelectedPaymentFilter
}: {
  services: SerializedService[],
  products: SerializedProduct[],
  authenticatedUser: User,
  selectedBookingFilter: string,
  setSelectedBookingFilter: (filter: BookingFilter) => void,
  selectedPaymentFilter: string,
  setSelectedPaymentFilter: (filter: PaymentFilter) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Bookings</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">
          View and manage all appointments
        </p>
      </div>

      <div className="flex flex-row sm:flex-row gap-3 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 whitespace-nowrap"
          onClick={() => setOpen(true)}
        >
          + New booking
        </Button>

        <Select value={selectedBookingFilter} onValueChange={setSelectedBookingFilter}>
          <SelectTrigger className="w-40 min-w-[140px] shadow-none">
            <SelectValue placeholder="All bookings" />
          </SelectTrigger>
          <SelectContent className="mt-11 shadow-sm">
            <SelectItem value="all">All bookings</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPaymentFilter} onValueChange={setSelectedPaymentFilter}>
          <SelectTrigger className="w-40 min-w-[140px] shadow-none">
            <SelectValue placeholder="All payments" />
          </SelectTrigger>
          <SelectContent className="mt-11 shadow-sm">
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create booking"
        childrenClassName="max-h-120"
        showSeparator={true}
      >
        <CreateBookingForm
          user={authenticatedUser}
          services={services}
          products={products}
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </div>
  )
}
