import { BookingWithService } from "@/features/booking/types"

type Props = {
  booking: BookingWithService
}

export default function ScheduleItem({ booking }: Props) {
  const isCancelled = booking.status === "CANCELLED"

  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${isCancelled ? "opacity-45" : ""}`}>

      <div>
        <div className="flex gap-4 items-center">
          <p className={`font-medium text-gray-900 ${isCancelled ? "line-through text-gray-400" : ""}`}>
            {booking.clientName}
          </p>
          <span className="text-gray-300">|</span>
          <p className="font-medium text-gray-500 text-sm">{booking.clientPhone}</p>
        </div>
        <p className="text-sm text-gray-400">
          {booking.services.map(s => s.service.name).join(", ")} · {booking.bookingTime}
        </p>
      </div>

      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
        ${booking.status === "CONFIRMED" ? "bg-lime-50 text-lime-700 border-lime-200" : ""}
        ${booking.status === "PENDING"   ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
        ${booking.status === "CANCELLED" ? "bg-red-50 text-red-400 border-red-100" : ""}
        ${booking.status === "COMPLETED" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
      `}>
        {booking.status}
      </span>

    </div>
  )
}
