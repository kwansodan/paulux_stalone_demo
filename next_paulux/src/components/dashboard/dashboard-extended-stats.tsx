import { Tag, CheckCircle2, Clock, RefreshCcw, XCircle } from "lucide-react"

type Props = {
  activePromos: number
  expiredPromos: number
  totalPromoUses: number
  partialPayments: number
  refundedPayments: number
  completedBookings: number
}

function StatCard({
  icon,
  label,
  value,
  sub,
  colour,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  colour: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colour}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardExtendedStats({
  activePromos,
  expiredPromos,
  totalPromoUses,
  partialPayments,
  refundedPayments,
  completedBookings,
}: Props) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-base text-gray-700">Additional Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Tag className="w-5 h-5" />}
          label="Active Promos"
          value={activePromos}
          sub="Currently usable"
          colour="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Expired Promos"
          value={expiredPromos}
          sub="Inactive or expired"
          colour="bg-red-50 text-red-500"
        />
        <StatCard
          icon={<Tag className="w-5 h-5" />}
          label="Promo Uses"
          value={totalPromoUses}
          sub="All-time total"
          colour="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Partial Payments"
          value={partialPayments}
          sub="In selected period"
          colour="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<RefreshCcw className="w-5 h-5" />}
          label="Refunds"
          value={refundedPayments}
          sub="In selected period"
          colour="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={completedBookings}
          sub="Bookings in period"
          colour="bg-teal-50 text-teal-600"
        />
      </div>
    </div>
  )
}
