'use client'
import Modal from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import CreateBookingForm from "./form/create-booking-form";
import { SerializedService } from "@/features/service/types";
import { User } from "@generated/prisma/client";
import { BookingFilter } from "./booking-client-shell";

export default function BookingHeader({ 
  services, 
  authenticatedUser, 
  selectedBookingFilter, 
  setSelectedBookingFilter 
}: {
  services: SerializedService[], 
  authenticatedUser: User, 
  selectedBookingFilter: string, 
  setSelectedBookingFilter: (filter: BookingFilter) => void 
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
        <p className="text-[16px] text-gray-600">
          View and manage all appointments
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700"
          onClick={() => setOpen(true)}
        >
          + New booking
        </Button>

        <Select value={selectedBookingFilter} onValueChange={setSelectedBookingFilter}>
          <SelectTrigger className="w-40 shadow-none">
            <SelectValue placeholder="All bookings" />
          </SelectTrigger>
          <SelectContent className="mt-11 shadow-sm">
            <SelectItem value="all">All bookings</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </div>
  )
}
