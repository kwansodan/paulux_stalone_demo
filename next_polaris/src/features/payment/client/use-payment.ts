import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { GatewayPaymentMetrics, PaymentMetrics } from "../types"
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


function normalizeGatewayMetrics(raw: {
  primary: { totalAmount: number; percentage: number; lastWebhookAt: string | Date | null }
  secondary: { totalAmount: number; percentage: number; lastWebhookAt: string | Date | null }
  routingThreshold: number
}): GatewayPaymentMetrics {
  const toIso = (d: string | Date | null) =>
    d == null ? null : typeof d === "string" ? d : (d as Date).toISOString()
  return {
    primaryNetTotal: raw.primary.totalAmount,
    secondaryNetTotal: raw.secondary.totalAmount,
    primaryPercentage: raw.primary.percentage,
    secondaryPercentage: raw.secondary.percentage,
    routingThreshold: raw.routingThreshold,
    primaryLastWebhookAt: toIso(raw.primary.lastWebhookAt),
    secondaryLastWebhookAt: toIso(raw.secondary.lastWebhookAt),
  }
}

export function useGatewayPaymentMetrics(initial: GatewayPaymentMetrics) {
  return useQuery({
    queryKey: ["gateway-payment-metrics"],
    queryFn: async () => {
      const res = await api.get("/payments/gateway-metrics")
      return normalizeGatewayMetrics(res.data.data)
    },
    initialData: initial,
  })
}

const GATEWAY_METRICS_TOAST_ID = "gateway-threshold"

export function useUpdateGatewayThreshold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (primaryPercentage: number) => {
      const res = await api.patch("/payments/gateway-metrics", {
        paystackPercentage: primaryPercentage,
      })
      return res.data
    },
    onMutate: async (primaryPercentage: number) => {
      await queryClient.cancelQueries({ queryKey: ["gateway-payment-metrics"] })
      const previous = queryClient.getQueryData<GatewayPaymentMetrics>(["gateway-payment-metrics"])
      queryClient.setQueryData<GatewayPaymentMetrics>(["gateway-payment-metrics"], (old) => {
        if (!old) return old
        return { ...old, routingThreshold: primaryPercentage }
      })
      toast.loading("Updating gateway allocation...", { id: GATEWAY_METRICS_TOAST_ID })
      return { previous }
    },
    onSuccess: () => {
      toast.success("Gateway allocation updated successfully", { id: GATEWAY_METRICS_TOAST_ID })
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["gateway-payment-metrics"], context.previous)
      }
      toast.error("Failed to update gateway allocation", { id: GATEWAY_METRICS_TOAST_ID })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-payment-metrics"] })
    },
  })
}


export function useCollectPayment() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.post(`/bookings/${bookingId}/top-up`)
      return data.data
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    }
  })
}
