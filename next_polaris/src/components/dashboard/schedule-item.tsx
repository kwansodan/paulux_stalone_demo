import { BookingWithService } from "@/features/booking/types"

type Props = {
  booking: BookingWithService
}

export default function ScheduleItem({ booking }: Props) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">

      <div>
        <div className="flex gap-4 items-center">
          <p className="font-medium  text-gray-900">{booking.clientName}</p>
          <span className="px-0">|</span>
          <p className="font-medium text-gray-900">{booking.clientPhone}</p>
        </div>
        <p className="text-sm text-gray-500">
          {booking.service.name} · {booking.bookingTime}
        </p>
      </div>

      <span
        className={`px-2 py-1 rounded-full text-xs
        ${booking.status === "CONFIRMED" && "bg-lime-50 text-lime-700 border-lime-700"}
        ${booking.status === "PENDING" && "bg-yellow-50 text-yellow-700 border-yellow-700"}
        ${booking.status === "CANCELLED" && "bg-red-50 text-red-700 border-red-700"}
        `}
      >
        {booking.status}
      </span>

    </div>
  )
}
