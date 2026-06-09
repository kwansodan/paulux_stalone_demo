"use client"

import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface ManualPaymentMethod {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const QUERY_KEY = ["manual-payment-methods"]

export function useGetManualPaymentMethods() {
  return useQuery<ManualPaymentMethod[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get("/api/manual-payment-methods")
      return data.data
    },
  })
}

export function useCreateManualPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await axios.post("/api/manual-payment-methods", { name })
      return data.data as ManualPaymentMethod
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Payment method added")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add payment method")
    },
  })
}

export function useUpdateManualPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; isActive?: boolean; sortOrder?: number }) => {
      const { data } = await axios.patch(`/api/manual-payment-methods/${id}`, payload)
      return data.data as ManualPaymentMethod
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update payment method")
    },
  })
}

export function useDeleteManualPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/manual-payment-methods/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Payment method deleted")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete payment method")
    },
  })
}
