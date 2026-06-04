import ScheduleItem from "./schedule-item"
import { BookingWithService } from "@/features/booking/types"
import ViewAllButton from "./view-all-button"
import { Calendar } from "lucide-react"

type Props = {
  bookings: BookingWithService[]
}

export default function ScheduleList({ bookings }: Props) {
  // Active bookings first, cancelled at the bottom
  const sorted = [...bookings].sort((a, b) => {
    if (a.status === "CANCELLED" && b.status !== "CANCELLED") return 1
    if (a.status !== "CANCELLED" && b.status === "CANCELLED") return -1
    return a.bookingTime.localeCompare(b.bookingTime)
  })

  return (
    <div className="bg-white rounded-xl border p-4 sm:p-5">

      <div className="flex flex-row justify-between items-center mb-4 gap-2">
        <h2 className="font-semibold text-base sm:text-lg">Today&apos;s schedule</h2>
        <ViewAllButton />
      </div>

      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.4 2.13336C22.6829 2.13336 22.9542 2.24574 23.1543 2.44578C23.3543 2.64582 23.4667 2.91713 23.4667 3.20003V4.2667H26.6667C27.5154 4.2667 28.3293 4.60384 28.9294 5.20395C29.5296 5.80407 29.8667 6.618 29.8667 7.4667V26.6667C29.8667 27.5154 29.5296 28.3293 28.9294 28.9294C28.3293 29.5296 27.5154 29.8667 26.6667 29.8667H5.33336C4.48467 29.8667 3.67074 29.5296 3.07062 28.9294C2.4705 28.3293 2.13336 27.5154 2.13336 26.6667V7.4667C2.13336 6.618 2.4705 5.80407 3.07062 5.20395C3.67074 4.60384 4.48467 4.2667 5.33336 4.2667H8.53336V3.20003C8.53336 2.91713 8.64574 2.64582 8.84578 2.44578C9.04582 2.24574 9.31713 2.13336 9.60003 2.13336C9.88293 2.13336 10.1542 2.24574 10.3543 2.44578C10.5543 2.64582 10.6667 2.91713 10.6667 3.20003V4.2667H21.3334V3.20003C21.3334 2.91713 21.4457 2.64582 21.6458 2.44578C21.8458 2.24574 22.1171 2.13336 22.4 2.13336ZM4.2667 26.6667L4.28803 26.88C4.37336 27.2982 4.7019 27.6267 5.12003 27.712L5.33336 27.7334H26.6667L26.88 27.712C27.085 27.6702 27.2732 27.5691 27.4211 27.4211C27.5691 27.2732 27.6702 27.085 27.712 26.88L27.7334 26.6667V12.8H4.2667V26.6667ZM7.4667 23.4667C7.74959 23.4667 8.0209 23.5791 8.22094 23.7791C8.42098 23.9792 8.53336 24.2505 8.53336 24.5334C8.53336 24.8163 8.42098 25.0876 8.22094 25.2876C8.0209 25.4876 7.74959 25.6 7.4667 25.6C7.1838 25.6 6.91249 25.4876 6.71245 25.2876C6.51241 25.0876 6.40003 24.8163 6.40003 24.5334C6.40003 24.2505 6.51241 23.9792 6.71245 23.7791C6.91249 23.5791 7.1838 23.4667 7.4667 23.4667Z" fill="#6A7282" />
          </svg>
          <p className="text-sm text-gray-500 mt-3">No bookings today</p>
        </div>
      )}

      {sorted.map((b) => (
        <ScheduleItem key={b.id} booking={b} />
      ))}

    </div>
  )
}
