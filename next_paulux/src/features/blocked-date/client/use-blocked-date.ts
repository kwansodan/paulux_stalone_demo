import { api } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BlockedDateInput } from "../utils/validation"
import { toast } from "sonner"
import { BlockedDate } from "@generated/prisma/client"


export default async function getBlockedDates(): Promise<BlockedDate[]>{
  const res = await api.get("/blocked-dates")
  return res.data.data;
}

export const useCreateBlockedDate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BlockedDateInput) => api.post("/blocked-dates", payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-dates"],
      })

      toast.success("Blocked date created successfully!")
    },
    onError: (error) => {
      console.error("Failed to create blocked date", error)
      toast.error("Failed to create blocked date")
    },
  })
}
export const useDeleteBlockedDate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (date: string) => api.delete(`/blocked-dates/${date}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-dates"],
      })

      toast.success("Blocked date deleted successfully!")
    },
    onError: (error) => {
      console.error("Failed to delete blocked date", error)
      toast.error("Failed to delete blocked date")
    },
  })
}