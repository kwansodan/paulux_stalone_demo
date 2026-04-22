'use client'
import React, { useState } from 'react'
import BookingsCalendar from './booking-calender'
import SelectDayPanel from './bookings-by-day'
import { SerializedService } from '@/features/service/types'
import { SerializedProduct } from '@/features/product/types'
import { User } from '@generated/prisma/client'
import { BookingFilter, PaymentFilter } from './booking-client-shell'

const BookingManager = ({
  authenticatedUser,
  services,
  products,
  selectedBookingFilter,
  selectedPaymentFilter,
}: {
  authenticatedUser: User
  services: SerializedService[]
  products: SerializedProduct[]
  selectedBookingFilter: BookingFilter
  selectedPaymentFilter: PaymentFilter
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      <div className="w-full lg:w-[60%] xl:w-175">
        <BookingsCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
      <div className="w-full lg:w-[40%] xl:w-105">
        <SelectDayPanel
          filter={selectedBookingFilter}
          paymentFilter={selectedPaymentFilter}
          services={services}
          products={products}
          user={authenticatedUser}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  )
}

export default BookingManager
