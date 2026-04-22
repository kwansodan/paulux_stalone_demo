'use client'
import BookingHeader from "@/features/booking/components/booking-header"
import BookingManager from "@/features/booking/components/booking-manager"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"
import { User } from "@generated/prisma/client"
import { useState } from "react"

export type BookingFilter = 'all' | 'completed' | 'cancelled'
export type PaymentFilter = 'all' | 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'FAILED'

const BookingClientShell = ({
  user,
  services,
  products,
}: {
  user: User
  services: SerializedService[]
  products: SerializedProduct[]
}) => {
  const [selectedBookingFilter, setSelectedBookingFilter] = useState<BookingFilter>('all')
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentFilter>('all')

  return (
    <div className="p-6 space-y-6">
      <BookingHeader
        authenticatedUser={user}
        services={services}
        products={products}
        selectedBookingFilter={selectedBookingFilter}
        setSelectedBookingFilter={(filter: BookingFilter) => setSelectedBookingFilter(filter)}
        selectedPaymentFilter={selectedPaymentFilter}
        setSelectedPaymentFilter={(filter: PaymentFilter) => setSelectedPaymentFilter(filter)}
      />

      <BookingManager
        selectedBookingFilter={selectedBookingFilter}
        selectedPaymentFilter={selectedPaymentFilter}
        authenticatedUser={user}
        services={services}
        products={products}
      />
    </div>
  )
}

export default BookingClientShell
