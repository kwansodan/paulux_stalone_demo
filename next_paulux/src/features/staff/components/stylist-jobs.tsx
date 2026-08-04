import { BookingWithServiceAndPayment } from "@/features/booking/types"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import { CalendarClock, Phone, Scissors } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-lime-50 text-lime-700 border-lime-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-50 text-red-400 border-red-100",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
}

// Server component — read-only list of a stylist's assigned jobs.
export default function StylistJobs({
  bookings,
  stylistId,
  emptyText,
}: {
  bookings: BookingWithServiceAndPayment[]
  stylistId: string
  emptyText: string
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
        <Scissors className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        // Booking assigned to this stylist at the booking level → all services are theirs;
        // otherwise show only the services assigned to them.
        const bookingLevel = (b as any).assignedToId === stylistId
        const myServices = bookingLevel
          ? b.services
          : b.services.filter((s) => (s as any).assignedTo?.id === stylistId)
        const serviceNames = (myServices.length > 0 ? myServices : b.services)
          .map((s) => s.service.name)
          .join(", ")
        const isCancelled = b.status === "CANCELLED"

        return (
          <div
            key={b.id}
            className={`rounded-2xl border border-gray-200 bg-white p-4 ${isCancelled ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`font-semibold text-gray-900 truncate ${isCancelled ? "line-through" : ""}`}>
                  {b.clientName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(b.bookingDate)} · {formatTime(b.bookingTime)}
                </p>
              </div>
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status] ?? ""}`}
              >
                {b.status.charAt(0) + b.status.slice(1).toLowerCase()}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
              <Scissors className="w-3.5 h-3.5 text-fuchsia-500 flex-shrink-0" />
              <span className="truncate">{serviceNames}</span>
            </div>

            {b.clientPhone && (
              <a
                href={`tel:${b.clientPhone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-fuchsia-600"
              >
                <Phone className="w-3.5 h-3.5" />
                {b.clientPhone}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
