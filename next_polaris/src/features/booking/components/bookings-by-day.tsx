"use client"

import { Card, CardContent } from "@/components/ui/card"
import BookingCard from "./booking-card"
import { useGetBookingsByDate } from "../client/hooks/use-booking"
import { BookingWithService } from "../types"
import { formatDate } from "../utils/helpers"
import Modal from "@/components/modal"
import { useMemo, useState } from "react"
import { User } from "@generated/prisma/client"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"
import EditBookingForm from "./form/edit-booking-form"
import { toast } from "sonner"
import CancelBookingForm from "./form/cancel-booking-form"
import { BookingFilter, PaymentFilter } from "./booking-client-shell"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"

export default function SelectDayPanel({ selectedDate, user, services, products, filter, paymentFilter }: { selectedDate: Date, user: User, services: SerializedService[], products: SerializedProduct[], filter: BookingFilter, paymentFilter: PaymentFilter }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithService | undefined | null>(null)

  const dateStr = selectedDate.toISOString().split("T")[0]

  const { data, isLoading } = useGetBookingsByDate(dateStr)

  const bookings: BookingWithService[] = useMemo(() => data?.data.bookings ?? [], [data])

  const filteredBookings = useMemo(() => {
    let result = bookings

    if (filter !== 'all') {
      result = result.filter((b) => b.status.toUpperCase() === filter.toUpperCase())
    }

    if (paymentFilter !== 'all') {
      result = result.filter((b) => calculatePaymentStatus(b) === paymentFilter)
    }

    return result
  }, [filter, paymentFilter, bookings])

  function handleBookingAction(bookingId: string, action: 'edit' | 'delete') {
    setSelectedBooking(null)

    const bookingSelected = filteredBookings.find((b) => b.id === bookingId)
    if (!bookingSelected) {
      toast("Invalid Booking Selected")
      return
    }

    setSelectedBooking(bookingSelected)

    if (action === 'edit') {
      setIsEditModalOpen(true)
    } else if (action === 'delete') {
      setIsCancelOpen(true)
    }
  }


  return (
    <>
      <Card className="shadow-none h-full p-0">
        <CardContent className="p-4 flex flex-col gap-3">

          <div className="flex justify-between">
            <h3 className="font-medium">{formatDate(dateStr)}</h3>
            {/* <button className="text-sm text-fuchsia-600">
              View all
            </button> */}
          </div>

          {isLoading ? (
            <p>Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookings for this {filter === 'all' ? 'date' : 'selection'}
            </p>
          ) : (
            <>
              {filteredBookings.map(b => (
                <BookingCard
                  key={b.id}
                  user={user}
                  booking={b}
                  onEdit={(bookingId) => handleBookingAction(bookingId, 'edit')}
                  onCancel={(bookingId) => handleBookingAction(bookingId, 'delete')}
                />
              ))}
            </>
          )}
        </CardContent>
      </Card >
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit booking"
        childrenClassName="max-h-120"
        showSeparator={true}
      >
        <EditBookingForm
          booking={selectedBooking!}
          user={user}
          services={services}
          products={products}
          onCancel={() => setIsEditModalOpen(false)}
          onSuccess={() => setIsEditModalOpen(false)}
        />
      </Modal>
      <Modal
        open={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Order?"
        childrenClassName="w-[90vw] max-w-[500px]"
        showSeparator={false}
        subtitle={"Are you sure you want to cancel this order? This action cannot be undone"}
      >
        <CancelBookingForm
          booking={selectedBooking!}
          onCancel={() => setIsCancelOpen(false)}
          onSuccess={() => setIsCancelOpen(false)}
        />
      </Modal>
    </>
  )
}