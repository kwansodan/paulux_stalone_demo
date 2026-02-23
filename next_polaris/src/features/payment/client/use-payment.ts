import { useQuery } from "@tanstack/react-query"
import { PaymentMetrics } from "../types"
import { api } from "@/lib/api"


const getPayments = async (query: Record<string, string>) => {
  const { data } = await api.get("/payments", { params: query })
  return data.data
}


export const usePayments = (query: Record<string, string>) => {
  return useQuery({
    queryKey: ["payments", query],
    queryFn: async () => getPayments(query),
    // keepPreviousData: true
  })
}


export function usePaymentMetrics(initial: PaymentMetrics) {
  return useQuery({
    queryKey: ["payment-metrics"],
    queryFn: async () => {
      const res = await api.get("/payments/metrics")
      return res.data.data
    },
    initialData: initial,
    select: (data) => ({
      totalDepositsToday: Number(data.totalDepositsToday) || 0,
      totalBalanceDueToday: Number(data.totalBalanceDueToday) || 0,
      thisWeeksRevenue: Number(data.thisWeeksRevenue) || 0,
      todaysPendingCollections: Number(data.todaysPendingCollections) || 0,
    }),
  })
}
