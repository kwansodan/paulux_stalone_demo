"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

type Props = {
  selectedDate: Date
  onSelectDate: (d: Date) => void
}

export default function BookingsCalendar({ selectedDate, onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  // Get the current date for range calculation
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth() - 12, 1)
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 12, 1)

  // Get days in current month
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Check if we can navigate to previous/next month
  const canGoPrev = currentMonth > minDate
  const canGoNext = currentMonth < maxDate

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(new Date(year, month - 1, 1))
    }
  }

  const handleNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(new Date(year, month + 1, 1))
    }
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day)
    onSelectDate(newDate)
  }

  // Generate array of day numbers
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Generate empty slots for days before the first day of month
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        
        <div className="flex justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
          >
            {"<"}
          </Button>
          <p className="font-medium">
            {monthNames[month]} {year}
          </p>
          <Button 
            variant="ghost" 
            onClick={handleNextMonth}
            disabled={!canGoNext}
          >
            {">"}
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Empty slots for days before month starts */}
          {emptySlots.map(i => (
            <div key={`empty-${i}`} />
          ))}
          
          {/* Actual days */}
          {days.map(day => {
            const isSelected = 
              day === selectedDate.getDate() &&
              month === selectedDate.getMonth() &&
              year === selectedDate.getFullYear()

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`cursor-pointer rounded-lg py-4
                  ${isSelected ? "bg-fuchsia-100" : "hover:bg-muted"}
                `}
              >
                {day}
              </div>
            )
          })}
        </div>

      </CardContent>
    </Card>
  )
}