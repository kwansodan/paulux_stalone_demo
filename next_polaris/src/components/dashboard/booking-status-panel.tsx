import { bookingsPath, paymentsPath } from "@/app/paths"
import Link from "next/link"

type Props = {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  partialPayments: number
  refundedPayments: number
}

const STATUS_ROWS = [
  { key: "confirmed", label: "Confirmed",  dot: "bg-lime-500",  text: "text-lime-700"  },
  { key: "pending",   label: "Pending",    dot: "bg-amber-400", text: "text-amber-700" },
  { key: "completed", label: "Completed",  dot: "bg-blue-500",  text: "text-blue-700"  },
  { key: "cancelled", label: "Cancelled",  dot: "bg-red-400",   text: "text-red-600"   },
] as const

export default function BookingStatusPanel({
  pending,
  confirmed,
  completed,
  cancelled,
  partialPayments,
  refundedPayments,
}: Props) {
  const counts: Record<string, number> = { confirmed, pending, completed, cancelled }
  const total = confirmed + pending + completed + cancelled

  return (
    <div className="bg-white rounded-xl border p-5 h-full flex flex-col gap-5">

      {/* Booking status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base text-gray-900">Booking Status</h2>
          <Link href={bookingsPath()} className="text-xs text-fuchsia-600 hover:underline font-medium">
            View all
          </Link>
        </div>

        {/* Proportion bar */}
        {total > 0 && (
          <div className="flex rounded-full overflow-hidden h-2 mb-4 gap-px">
            {STATUS_ROWS.map(({ key, dot }) => {
              const pct = (counts[key] / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={key}
                  className={`${dot} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>
        )}

        <div className="space-y-2.5">
          {STATUS_ROWS.map(({ key, label, dot, text }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${counts[key] > 0 ? text : "text-gray-300"}`}>
                {counts[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment flags */}
      <div className="border-t pt-5 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Payment Flags</h3>
          <Link href={paymentsPath()} className="text-xs text-fuchsia-600 hover:underline font-medium">
            Payments
          </Link>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Partial payments</span>
            <span className={`text-sm font-semibold tabular-nums ${partialPayments > 0 ? "text-amber-600" : "text-gray-300"}`}>
              {partialPayments}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Refunds</span>
            <span className={`text-sm font-semibold tabular-nums ${refundedPayments > 0 ? "text-red-500" : "text-gray-300"}`}>
              {refundedPayments}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
