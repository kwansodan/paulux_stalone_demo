"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type Props = {
  value?: DateRange
  onChange: (range?: DateRange) => void
}


export function DatePickerWithRange({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-60 h-12 bg-gray-50 shadow-none border-[#E2E8F0] rounded-lg justify-start text-left font-normal",
            !value?.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              `${format(value.from, "MMM dd, yyyy")} – ${format(
                value.to,
                "MMM dd, yyyy"
              )}`
            ) : (
              format(value.from, "MMM dd, yyyy")
            )
          ) : (
            "Pick a date"
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto h-66 overflow-auto p-2" align="start">
        <DayPicker
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          className="compact-daypicker "
          formatters={{
            formatWeekdayName: (date) => {
              const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              return days[date.getDay()];
            }
          }}
          weekStartsOn={0}
        />

        {/* Footer actions */}
        <div className="flex justify-between pt-2 border-t mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({
                  from: undefined,
                  to: undefined
              })
              setOpen(false)
            }}
          >
            Clear
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
