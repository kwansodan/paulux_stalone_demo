import { Banknote, Smartphone, CreditCard, Tag, CalendarPlus } from "lucide-react"

type Props = {
  cash: number
  momo: number
  card: number
  discounts: number
  bookedTodayValue: number
}

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

export default function RevenueBreakdown({ cash, momo, card, discounts, bookedTodayValue }: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 sm:p-5 space-y-5">

      {/* Cash received today */}
      <div>
        <h2 className="font-semibold text-base sm:text-lg mb-1">Cash Received</h2>
        <p className="text-xs text-gray-400 mb-3">Actual payments received in the selected period, by method</p>

        <Row
          icon={<Banknote className="w-4 h-4" />}
          label="Cash"
          amount={cash}
          colour="bg-green-50 text-green-600"
        />
        <Row
          icon={<Smartphone className="w-4 h-4" />}
          label="Mobile Money"
          amount={momo}
          colour="bg-fuchsia-50 text-fuchsia-600"
        />
        <Row
          icon={<CreditCard className="w-4 h-4" />}
          label="Bank Card"
          amount={card}
          colour="bg-blue-50 text-blue-600"
        />
        <Row
          icon={<Tag className="w-4 h-4" />}
          label="Discounts given"
          amount={discounts}
          colour="bg-orange-50 text-orange-500"
        />

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Net received</span>
          <span className="text-base font-bold text-gray-900">
            GHS {(cash + momo + card).toFixed(2)}
          </span>
        </div>
      </div>

      {/* New bookings booked today */}
      <div className="border-t pt-5">
        <h2 className="font-semibold text-base sm:text-lg mb-1">Booked Today</h2>
        <p className="text-xs text-gray-400 mb-3">Value of new bookings created today (any service date)</p>

        <Row
          icon={<CalendarPlus className="w-4 h-4" />}
          label="New bookings value"
          amount={bookedTodayValue}
          colour="bg-violet-50 text-violet-600"
        />
      </div>

    </div>
  )
}
