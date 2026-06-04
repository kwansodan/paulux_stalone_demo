import { Banknote, Smartphone, CreditCard, Tag } from "lucide-react"

type Props = {
  cash: number
  momo: number
  card: number
  discounts: number
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

export default function RevenueBreakdown({ cash, momo, card, discounts }: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 sm:p-5">
      <h2 className="font-semibold text-base sm:text-lg mb-1">Today&apos;s Revenue Breakdown</h2>
      <p className="text-xs text-gray-400 mb-4">Payments received today by method</p>

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

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Net received</span>
        <span className="text-base font-bold text-gray-900">
          GHS {(cash + momo + card).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
