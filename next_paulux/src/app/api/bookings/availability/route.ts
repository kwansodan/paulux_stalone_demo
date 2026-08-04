import { NextRequest, NextResponse } from "next/server"
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository"
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { serviceRepository } from "@/features/service/server/service.repository"
import { isPastSlot } from "@/features/booking/utils/helpers"
import { isTime24HoursInAdvance } from "@/utils/helpers"
import { authRepository } from "@/features/auth/server/auth.repository"
import { prisma } from "@/lib/prisma"

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
  const serviceIdsParam = searchParams.get("serviceIds")
  const userId = searchParams.get("userId")

  const serviceIds = serviceIdsParam ? serviceIdsParam.split(",") : (serviceId ? [serviceId] : [])

  if (!date || serviceIds.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  let user
  if (userId) {
    user = await authRepository.findUserById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid userId" }, { status: 400 })
    }
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
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })
  if (services.length === 0) return NextResponse.json({ slots: [] })

  const duration = services.reduce((sum, s) => sum + s.durationMinutes, 0)

  // Check if any of the services have restricted latest booking time
  for (const service of services) {
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
  }

  // 4) generate base slots
  const slots = []
  let current = hours.startTime

  while (current < hours.endTime) {
    const end = addMinutes(current, duration)

    if (end <= hours.endTime) {
      const isPast = isPastSlot(dateObj, current)
      const is24HoursAhead = true // user && user.role === "ADMIN" ? true : isTime24HoursInAdvance(dateObj, current)

      let available = false

      if (!isPast) {
        available = !isPast && await bookingRepository.isSlotAvailable(
          dateObj,
          current,
          duration,
          undefined,
          serviceIds,
        )
      }

      slots.push({ time: current, available })
    }

    current = addMinutes(current, 30)
  }

  return NextResponse.json({ slots })
}
