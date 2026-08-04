"use client"

import { Button } from "@/components/ui/button"
import { useAvailableSlots } from "@/features/booking/client/hooks/use-booking"
import { cn } from "@/lib/utils"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  selectedDate: string | null
  selectedTime: string | null
  selectedServiceIds: string[]
  onSelectDate: (date: string) => void
  onSelectTime: (time: string) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export default function BookingDateTimeStep({
  selectedDate,
  selectedTime,
  selectedServiceIds,
  onSelectDate,
  onSelectTime,
  onNext,
  onBack,
  canProceed,
}: Props) {
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0]
      onSelectDate(today)
    }

    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0]
      onSelectDate(today)
    }
  }, [])

  const { data, isLoading, error } = useAvailableSlots(selectedDate ?? undefined, selectedServiceIds.length > 0 ? selectedServiceIds : undefined)
  const slots = data?.slots ?? []

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0]
      onSelectDate(dateStr)
      onSelectTime("")
    }
  }

  const selected = selectedDate ? new Date(selectedDate) : undefined

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Pick Date and Time</h2>

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
              const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
              return <Icon className="h-5 w-5 stroke-[3px] text-gray-600" />;
            }
          }}
          modifiersClassNames={{
            today: "!text-fuchsia-500 font-medium",
            selected: '!bg-fuchsia-600 !text-white !rounded-lg',
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
            day_selected: "bg-fuchsia-600 text-white hover:bg-fuchsia-600  font-medium",
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600"></div>
            <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-600">
              Failed to load available times. Please try again.
            </p>
          </div>
        )}

        {/* Slots Grid */}
        {!isLoading && !error && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot: { available: boolean; time: string }) => (
              <Button
                type="button"
                key={slot.time}
                disabled={!slot.available}
                className={cn(
                  "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
                  selectedTime === slot.time && 'bg-fuchsia-500 hover:bg-fuchsia-600',
                  ((slot.available && !selectedTime) || (selectedTime !== slot.time)) && 'bg-fuchsia-200 hover:bg-fuchsia-300 text-black',
                  !slot.available && 'bg-gray-500'
                )}
                onClick={() => onSelectTime(slot.time)}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        )}

        {/* No Slots Available */}
        {!isLoading && !error && slots.length === 0 && selectedDate && (
          <p className="text-sm text-gray-400">
            No booking times available for booking date selected
          </p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-14 rounded-full text-base font-medium border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}