import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { SerializedGiftCard } from "../types"

const QUERY_KEY = ["gift-card-orders"]

export function useGetGiftCards(params?: { status?: string; search?: string }) {
  return useQuery<SerializedGiftCard[]>({
    queryKey: [...QUERY_KEY, params],
    queryFn: async () => {
      const res = await axios.get("/api/gift-cards", { params })
      return res.data.data
    },
  })
}

export function useCancelGiftCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post(`/api/gift-cards/${id}/cancel`)
      return res.data.data as SerializedGiftCard
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
