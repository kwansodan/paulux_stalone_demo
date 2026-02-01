import { BookingWithService } from "@/features/booking/types"

type Props = {
  booking: BookingWithService
}

export default function ScheduleItem({ booking }: Props) {
  return (
    <div className="flex items-center justify-between py-3 border-b">

      <div>
        <p className="font-medium">{booking.clientName}</p>
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
