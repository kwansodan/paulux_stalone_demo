import { Calendar, TrendingUp, Banknote } from "lucide-react"

type Props = {
  bookingsCount: number
  revenue: number
  netCollected: number
}

function Kpi({
  icon,
  label,
  sub,
  value,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  value: string | number
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-fuchsia-50 text-fuchsia-600">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold leading-tight text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function fmt(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DashboardKpis({ bookingsCount, revenue, netCollected }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <Kpi
        icon={<Calendar className="w-5 h-5" />}
        label="Bookings"
        sub="In selected period"
        value={bookingsCount}
      />
      <Kpi
        icon={<TrendingUp className="w-5 h-5" />}
        label="Revenue"
        sub="Services scheduled"
        value={fmt(revenue)}
      />
      <Kpi
        icon={<Banknote className="w-5 h-5" />}
        label="Collected"
        sub="Cash received"
        value={fmt(netCollected)}
      />
    </div>
  )
}
