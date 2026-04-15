import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { SerializedPromoCode } from "../types"

const QUERY_KEY = ["promo-codes"]

export function useGetPromoCodes() {
  return useQuery<SerializedPromoCode[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await axios.get("/api/promo-codes")
      return res.data.data
    },
  })
}

export function useCreatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await axios.post("/api/promo-codes", payload)
      return res.data.data as SerializedPromoCode
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const res = await axios.patch(`/api/promo-codes/${id}`, payload)
      return res.data.data as SerializedPromoCode
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeletePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/promo-codes/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
