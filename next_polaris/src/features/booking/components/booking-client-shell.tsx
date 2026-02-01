'use client'
import BookingHeader from "@/features/booking/components/booking-header"
import BookingManager from "@/features/booking/components/booking-manager"
import { SerializedService } from "@/features/service/types"
import { User } from "@generated/prisma/client"
import { useState } from "react"

export type BookingFilter = 'all' | 'completed' | 'cancelled'

const BookingClientShell = ({ user, services }: { user: User, services: SerializedService[] }) => {
  const [selectedBookingFilter, setSelectedBookingFilter] = useState<BookingFilter>('all')
  return (
    <div className="p-6 space-y-6">
      <BookingHeader
        authenticatedUser={user}
        services={services}
        selectedBookingFilter={selectedBookingFilter}
        setSelectedBookingFilter={(filter: BookingFilter) => setSelectedBookingFilter(filter)}
      />

      <BookingManager selectedBookingFilter={selectedBookingFilter} authenticatedUser={user} services={services} />
    </div>
  )
}

export default BookingClientShell
