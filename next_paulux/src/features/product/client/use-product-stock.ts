import { api } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { StockMovementInput } from "../utils/validation"
import { StockMovement } from "../types"

export function useGetStockMovements(productId: string) {
  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/stock`)
      return res.data.data
    },
    enabled: !!productId,
  })
}

export function useRecordStockMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, ...payload }: StockMovementInput & { productId: string }) => {
      const res = await api.post(`/products/${productId}/stock`, payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements", variables.productId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Stock movement recorded")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to record movement"
      toast.error(message)
    },
  })
}
