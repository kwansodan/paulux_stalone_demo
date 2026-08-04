import { BookingWithService } from "@/features/booking/types"

type Props = {
  booking: BookingWithService
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-lime-50 text-lime-700 border-lime-200",
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-50 text-red-400 border-red-100",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
}

export default function ScheduleItem({ booking }: Props) {
  const isCancelled = booking.status === "CANCELLED"

  return (
    <div className={`flex items-start gap-4 py-3.5 border-b last:border-b-0 ${isCancelled ? "opacity-40" : ""}`}>

      {/* Time anchor */}
      <div className="flex-shrink-0 w-14 text-right pt-0.5">
        <span className="text-sm font-semibold text-gray-700 tabular-nums">{booking.bookingTime}</span>
      </div>

      {/* Divider dot */}
      <div className="flex-shrink-0 flex flex-col items-center mt-1.5 gap-1">
        <span className={`w-2 h-2 rounded-full ${isCancelled ? "bg-red-300" : "bg-fuchsia-400"}`} />
        <span className="w-px flex-1 bg-gray-100 min-h-[1rem]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-semibold text-sm text-gray-900 truncate ${isCancelled ? "line-through" : ""}`}>
            {booking.clientName}
          </p>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[booking.status] ?? ""}`}>
            {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {booking.services.map(s => s.service.name).join(", ")}
          {booking.clientPhone ? ` · ${booking.clientPhone}` : ""}
        </p>
      </div>

    </div>
  )
}
