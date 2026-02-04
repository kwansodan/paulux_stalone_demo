import { api } from "@/lib/api";
import { BusinessHourInput, BusinessStatusInput } from "../utils/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BusinessHour } from "@generated/prisma/client";

type WithoutStatus = Omit<BusinessHourInput,'isOpen'>


export async function getBusinessHours():Promise<BusinessHour[]> {
  const res = await api.get('/business-hours')
  return res.data.data;
}

export async function updateBusinessHour(payload: WithoutStatus){
  return api.post(`/business-hours`, payload)
}

export function updateBusinessHourStatus(dayOfWeek: number, payload: BusinessStatusInput) {
  return api.post(`/business-hours/${dayOfWeek}/status`, payload)
}

export function useEditBusinessHour() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: WithoutStatus) => updateBusinessHour(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["business-hours"],
      })

      toast.success("Business hour updated successfully!")
    },
    onError: (error) => {
      console.error("Failed to update business-hour", error)
      toast.error("Failed to update business hour")
    },
  })
}



export function useUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dayOfWeek, status }: { dayOfWeek: number, status: boolean }) => updateBusinessHourStatus(dayOfWeek, { isOpen: status }),
    onMutate: async ({ dayOfWeek, status }) => {
      await queryClient.cancelQueries({ queryKey: ['business-hours'] })

      const previousBusinessHours = queryClient.getQueryData<BusinessHour[]>(['business-hours'])

      queryClient.setQueryData(['business-hours'], (oldBusinessHours: BusinessHour[] | undefined) => {
        if (!oldBusinessHours) return oldBusinessHours
        return oldBusinessHours.map(bh =>
          bh.dayOfWeek === dayOfWeek ? { ...bh, isOpen: status } : bh
        )
      })

      toast.loading("Updating business hour status...", { id: "bh-status" })

      return { previousBusinessHours }
    },
    onSuccess: async (data) => {
      toast.success("Business Hour status updated successfully", { id: "bh-status" })
    },
    onError: (error, variables, context) => {
      if (context?.previousBusinessHours) {
        queryClient.setQueryData(['business-hours'], context.previousBusinessHours)
      }
      console.error("Failed to update business hour status", error)
      toast.error("Failed to update business hour status", { id: "bh-status" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-hours"],
      })
    }
  })
}