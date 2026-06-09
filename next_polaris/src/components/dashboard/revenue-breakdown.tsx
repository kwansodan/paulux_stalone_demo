import { Banknote, Smartphone, CreditCard, Tag, CalendarPlus, ArrowRightLeft, TrendingUp, Wallet } from "lucide-react"

type MethodRow = { label: string; amount: number }

type Props = {
  methodBreakdown: MethodRow[]
  discounts: number
  bookedTodayValue: number
  netReceived: number
  revenue: number
  preBookingReceived: number
}

const METHOD_STYLES: Record<string, { colour: string; icon: React.ReactNode }> = {
  "Cash":         { colour: "bg-green-50 text-green-600",     icon: <Banknote className="w-4 h-4" /> },
  "Mobile Money": { colour: "bg-fuchsia-50 text-fuchsia-600", icon: <Smartphone className="w-4 h-4" /> },
  "Bank Card":    { colour: "bg-blue-50 text-blue-600",       icon: <CreditCard className="w-4 h-4" /> },
}

const FALLBACK_COLOURS = [
  "bg-amber-50 text-amber-600",
  "bg-teal-50 text-teal-600",
  "bg-rose-50 text-rose-600",
  "bg-indigo-50 text-indigo-600",
  "bg-cyan-50 text-cyan-600",
]

function Row({
  icon,
  label,
  amount,
  colour,
}: {
  icon: React.ReactNode
  label: string
  amount: number
  colour: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colour}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${amount > 0 ? "text-gray-900" : "text-gray-400"}`}>
        GHS {amount.toFixed(2)}
      </span>
    </div>
  )
}

export default function RevenueBreakdown({
  methodBreakdown,
  discounts,
  bookedTodayValue,
  netReceived,
  revenue,
  preBookingReceived,
}: Props) {
  // Cash received that applies to period services = total received minus pre-payments for future bookings
  const cashForPeriod = netReceived - preBookingReceived
  const outstanding = Math.max(0, revenue - cashForPeriod)

  return (
    <div className="bg-white rounded-xl border p-4 sm:p-5 space-y-5">

      {/* Cash received by method */}
      <div>
        <h2 className="font-semibold text-base sm:text-lg mb-1">Cash Received</h2>
        <p className="text-xs text-gray-400 mb-3">Actual payments received in the selected period, by method</p>

        {methodBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No payments received in this period.</p>
        ) : (
          methodBreakdown.map((m, i) => {
            const style = METHOD_STYLES[m.label] ?? {
              colour: FALLBACK_COLOURS[i % FALLBACK_COLOURS.length],
              icon: <Wallet className="w-4 h-4" />,
            }
            return (
              <Row key={m.label} icon={style.icon} label={m.label} amount={m.amount} colour={style.colour} />
            )
          })
        )}

        <Row
          icon={<Tag className="w-4 h-4" />}
          label="Discounts given"
          amount={discounts}
          colour="bg-orange-50 text-orange-500"
        />

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Net received</span>
          <span className="text-base font-bold text-gray-900">
            GHS {netReceived.toFixed(2)}
          </span>
        </div>
      </div>

      {/* New bookings created in the period */}
      <div className="border-t pt-5">
        <h2 className="font-semibold text-base sm:text-lg mb-1">New Bookings</h2>
        <p className="text-xs text-gray-400 mb-3">Value of bookings created in the selected period (any service date)</p>

        <Row
          icon={<CalendarPlus className="w-4 h-4" />}
          label="New bookings value"
          amount={bookedTodayValue}
          colour="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Reconciliation */}
      <div className="border-t pt-5">
        <h2 className="font-semibold text-base sm:text-lg mb-1">Reconciliation</h2>
        <p className="text-xs text-gray-400 mb-3">
          Why revenue and cash received may differ for this period
        </p>

        <Row
          icon={<TrendingUp className="w-4 h-4" />}
          label="Revenue (services due)"
          amount={revenue}
          colour="bg-emerald-50 text-emerald-600"
        />
        <Row
          icon={<ArrowRightLeft className="w-4 h-4" />}
          label="Net received"
          amount={netReceived}
          colour="bg-sky-50 text-sky-600"
        />
        {preBookingReceived > 0 && (
          <Row
            icon={<CalendarPlus className="w-4 h-4" />}
            label="Pre-payments (future bookings)"
            amount={preBookingReceived}
            colour="bg-purple-50 text-purple-600"
          />
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Outstanding balance</span>
          <span className={`text-base font-bold ${outstanding > 0 ? "text-red-600" : "text-gray-400"}`}>
            GHS {outstanding.toFixed(2)}
          </span>
        </div>
        {outstanding > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            GHS {outstanding.toFixed(2)} in revenue for this period has not yet been collected.
          </p>
        )}
      </div>

    </div>
  )
}
