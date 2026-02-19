"use client"

import { RefreshCw, DollarSign, Clock, TrendingUp, Wallet } from "lucide-react"
import MetricCard from "@/components/metric-card"
import { Button } from "@/components/ui/button"
import { usePaymentMetrics } from "../client/use-payment"
import { PaymentMetrics as IPaymentMetrics } from "../types"


export default function PaymentMetrics({ initialMetrics }: { initialMetrics: IPaymentMetrics }) {
  const { data, refetch, isFetching } = usePaymentMetrics(initialMetrics)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-[16px] text-gray-600">
            View deposit payments and balances due
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Deposits Received" value={`GHS ${data.totalDeposits.toFixed(2)}`} icon={
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.645 12.1611C10.9443 12.3554 11.0488 12.7487 10.8526 13.0469C10.2132 14.0188 9.34426 14.7839 8.33601 15.255C7.14692 15.8105 5.82743 15.9273 4.5735 15.5881C3.31957 15.2489 2.19806 14.4717 1.37554 13.3719C0.553016 12.2722 0.0733415 10.9086 0.00774966 9.4836C-0.0578422 8.0586 0.294147 6.64822 1.01144 5.46191C1.72874 4.2756 2.77309 3.37663 3.9894 2.8985C5.20571 2.42036 6.52911 2.38857 7.76307 2.80784C8.80742 3.16269 9.74057 3.82461 10.4654 4.71727C10.691 4.99515 10.6266 5.39789 10.3485 5.62323V5.62323C10.0302 5.88114 9.56172 5.80488 9.28634 5.50158C8.75264 4.91378 8.09509 4.47499 7.36808 4.22797C6.41057 3.90263 5.38366 3.9273 4.43985 4.29832C3.49604 4.66933 2.68566 5.3669 2.12907 6.28743C1.57247 7.20797 1.29934 8.30237 1.35024 9.40811C1.40113 10.5139 1.77334 11.572 2.41159 12.4253C3.04984 13.2787 3.92008 13.8817 4.89309 14.145C5.86609 14.4082 6.88997 14.3175 7.81266 13.8865C8.5191 13.5565 9.13738 13.0403 9.61603 12.388C9.85493 12.0625 10.3062 11.9413 10.645 12.1611V12.1611Z" fill="#1D293D" />
            <rect x="5.00012" width="1.5" height="18" rx="0.6" fill="#1D293D" />
          </svg>
        } iconClassName="bg-gray-100" />
        <MetricCard title="Total Balance Due Today" value={`GHS ${data.totalBalanceDueToday.toFixed(2) || 0}`} icon={<Wallet />} iconClassName="bg-[#FFFBEB] text-[#973C00]" />
        <MetricCard title="This Week’s Revenue" value={`GHS ${data.thisWeeksRevenue.toFixed(2) || 0}`} icon={<TrendingUp />} iconClassName="bg-[#F0F9FF] text-[#00598A]" />
        <MetricCard title="Today’s Pending Collections" value={data.todaysPendingCollections} icon={<Clock />} iconClassName="bg-fuchsia-50 text-fuchsia-800" />
      </div>
    </div>
  )
}
