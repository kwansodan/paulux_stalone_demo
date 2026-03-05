import { NextRequest, NextResponse } from "next/server"
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository"
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { serviceRepository } from "@/features/service/server/service.repository"
import { isPastSlot } from "@/features/booking/utils/helpers"

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + mins
  const hh = String(Math.floor(total / 60)).padStart(2, "0")
  const mm = String(total % 60).padStart(2, "0")
  return `${hh}:${mm}`
}


export async function GET(req: NextRequest) {
  // const auth = await requireRoleApi(['ADMIN'])
  // if (!auth.ok) return auth.response


  const { searchParams } = req.nextUrl

  const date = searchParams.get("date")
  const serviceId = searchParams.get("serviceId")

  if (!date || !serviceId) {
    return NextResponse.json({ slots: [] })
  }

  const dateObj = new Date(date)
  const day = dateObj.getUTCDay()

  // 1) blocked?
  const blocked = await blockedDateRepository.findByDate(date)
  if (blocked) return NextResponse.json({ slots: [] })

  // 2) business hours
  const hours = await businessHourRepository.findByDayOfWeek(day)
  if (!hours || !hours.isOpen) return NextResponse.json({ slots: [] })

  // 3) service duration
  const service = await serviceRepository.findById(serviceId)
  if (!service) return NextResponse.json({ slots: [] })

  const duration = service.durationMinutes

  // Check if the service has a latest booking time and adjust the end time accordingly
  const latestBookingTime = service.latestBookingTime
  if (latestBookingTime) {
    const [latestHour, latestMinute] = latestBookingTime.split(":").map(Number)
    const latestEndTime = new Date(dateObj)
    latestEndTime.setHours(latestHour, latestMinute, 0, 0)

    const hoursEndTime = new Date(dateObj);
    const [endHour, endMinute] = hours.endTime.split(":").map(Number);
    hoursEndTime.setHours(endHour, endMinute, 0, 0);

    if (latestEndTime < hoursEndTime) {
      hours.endTime = latestEndTime.toISOString().slice(11, 16)
    }
  }

  // 4) generate base slots
  const slots = []
  let current = hours.startTime

  while (current < hours.endTime) {
    const end = addMinutes(current, duration)

    if (end <= hours.endTime) {
      const isPast = isPastSlot(dateObj, current)
      let available = false

      if (!isPast) {
        available = !isPast && await bookingRepository.isSlotAvailable(
          dateObj,
          current
        )
      }

      slots.push({ time: current, available })
    }

    current = addMinutes(current, 30)
  }

  return NextResponse.json({ slots })
}
