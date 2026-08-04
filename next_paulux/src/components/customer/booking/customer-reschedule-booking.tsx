"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAvailableSlots, usePublicRescheduleBooking } from "@/features/booking/client/hooks/use-booking"
import { customerBookingSummaryPath } from "@/app/paths"

type Props = {
  booking: any
}

export default function CustomerRescheduleBooking({ booking }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (booking.bookingDate) {
      return booking.bookingDate
    }
    const today = new Date().toISOString().split("T")[0]
    return today
  })

  const [selectedTime, setSelectedTime] = useState<string | null>(booking.bookingTime || null)

  const { data, isLoading, error } = useAvailableSlots(
    selectedDate ?? undefined,
    booking.services?.map((s: any) => s.serviceId) ?? []
  )
  const slots = data?.slots ?? []

  const { mutate: reschedule, isPending } = usePublicRescheduleBooking()

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0]
      setSelectedDate(dateStr)
      setSelectedTime(null)
    }
  }

  const selected = selectedDate ? new Date(selectedDate) : undefined
  const canProceed = !!selectedDate && !!selectedTime

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return

    reschedule(
      { id: booking.id, bookingDate: selectedDate, bookingTime: selectedTime },
      {
        onSuccess: () => {
          router.push(customerBookingSummaryPath(booking.id))
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reschedule booking</h1>
      <p className="text-sm text-gray-600">
        Choose a new date and time for your appointment.
      </p>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return date < today
          }}
          components={{
            Chevron: ({ orientation }) => {
              const Icon = orientation === "left" ? ChevronLeft : ChevronRight
              return <Icon className="h-5 w-5 stroke-[3px] text-gray-600" />
            },
          }}
          modifiersClassNames={{
            today: "!text-fuchsia-500 font-medium",
            selected: "!bg-fuchsia-600 !text-white !rounded-lg",
          }}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center w-full mb-4",
            caption_label: "py-2 ml-3 text-sm font-bold text-gray-900",
            nav: "space-x-1 flex items-center absolute right-6 top-0",
            nav_button: "h-7 w-7 bg-transparent p-0 hover:opacity-50 ",
            nav_button_previous: "text-indigo-600",
            nav_button_next: "text-indigo-600",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-400 rounded-md w-9 font-normal text-[13px]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 p-0 font-normal rounded-lg hover:bg-gray-100 text-sm",
            day_selected: "bg-fuchsia-600 text-white hover:bg-fuchsia-600 font-medium",
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-300 opacity-50",
            day_hidden: "invisible",
          }}
        />
      </div>

      {/* Available times */}
      <div className="space-y-1">
        <label className="text-sm font-normal text-foreground">
          Booking Time <span className="text-red-500">*</span>
        </label>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600" />
            <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-600">
              Failed to load available times. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !error && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot: { available: boolean; time: string }) => (
              <Button
                type="button"
                key={slot.time}
                disabled={!slot.available}
                className={cn(
                  "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
                  selectedTime === slot.time && "bg-fuchsia-500 hover:bg-fuchsia-600",
                  ((slot.available && !selectedTime) || selectedTime !== slot.time) &&
                  "bg-fuchsia-200 hover:bg-fuchsia-300 text-black",
                  !slot.available && "bg-gray-500"
                )}
                onClick={() => setSelectedTime(slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        )}

        {!isLoading && !error && slots.length === 0 && selectedDate && (
          <p className="text-sm text-gray-400">
            No booking times available for the selected date. Please pick another day.
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!canProceed || isPending}
          className="w-full h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
        >
          {isPending ? "Rescheduling..." : "Reschedule booking"}
        </Button>
      </div>
    </div>
  )
}

