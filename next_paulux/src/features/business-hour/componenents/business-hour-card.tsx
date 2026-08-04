"use client"

import { BusinessHour } from "@generated/prisma/client"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useEditBusinessHour, useUpdateStatus } from "../client/use-business-hour"
import { debounce } from "lodash"
import { ToggleSwitch } from "@/features/service/components/toggle-switch"

export default function BusinessHourCard({
  label,
  hour,
}: {
  label: string
  hour: BusinessHour
}) {
  const [start, setStart] = useState(hour.startTime || "09:00")
  const [end, setEnd] = useState(hour.endTime || "17:00")

  const updateStatus = useUpdateStatus()
  const update = useEditBusinessHour()

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

  const commit = debounce((payload: { startTime: string; endTime: string }) => {
    if (!timeRegex.test(payload.startTime) || !timeRegex.test(payload.endTime)) return
    update.mutate({
      dayOfWeek: hour.dayOfWeek,
      ...payload
    }, {
      onError: () => {
        setStart(hour.startTime)
        setEnd(hour.endTime)
      },
    })
  }, 500)

  useEffect(() => {
    if (start !== hour.startTime || end !== hour.endTime) {
      commit({ startTime: start, endTime: end })
    }
    return () => commit.cancel()
  }, [start, end])

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">

      <div className="flex items-center gap-3">
        <p className="font-medium w-24">{label}</p>

        <ToggleSwitch
          checked={hour.isOpen}
          onChecked={() => updateStatus.mutate({ dayOfWeek: hour.dayOfWeek, status: true })}
          onUnchecked={() => updateStatus.mutate({ dayOfWeek: hour.dayOfWeek, status: false })}
        />
        {/* <span className="text-sm text-muted-foreground">
          {open ? "Open" : "Closed"}
        </span> */}
      </div>

      {hour.isOpen && (
        <div className="flex gap-3">
          <Input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-28 h-10 shadow-none"
          />
          <Input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-28 h-10 shadow-none"
          />
        </div>
      )}
    </div>
  )
}
