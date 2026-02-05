import { api } from "@/lib/api"
import { ServiceFormInput, ServiceStatusInput } from "../utils/validation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SerializedService } from "../types"


export function createOrEditService(payload: ServiceFormInput & { id?: string }) {
  return api.post("/services", payload)
}

export function deleteService(id: string) {
  return api.delete(`/services/${id}`)
}

export function updateServiceStatus(id: string, payload: ServiceStatusInput) {
  return api.post(`/services/${id}/status`, payload)
}

export async function getServices(): Promise<SerializedService[]> {
  const res = await api.get(`/services`)
  return res.data.data
}

export function useGetServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      })
      
      console.log("DATA AFTER DELETING", data)
      toast.success(data.data.message|| "Service deleted successfully")
    },
    onError: (error) => {
      console.error("Failed to delete service", error)
      toast.error("Failed to delete service")
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      })

      toast.success("Service created successfully!")
    },
    onError: (error) => {
      console.error("Failed to create service", error)
      toast.error("Failed to create service")
    },
  })
}
export function useEditService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      })

      toast.success("Service updated successfully!")
    },
    onError: (error) => {
      console.error("Failed to update service", error)
      toast.error("Failed to update service")
    },
  })
}



export function useUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: boolean }) => updateServiceStatus(id, { isActive: status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['services'] })

      const previousServices = queryClient.getQueryData<SerializedService[]>(['services'])

      queryClient.setQueryData(['services'], (oldServices: SerializedService[] | undefined) => {
        if (!oldServices) return oldServices
        return oldServices.map(service =>
          service.id === id ? { ...service, isActive: status } : service
        )
      })

      toast.loading("Updating service status...", { id: "service-status" })

      return { previousServices }
    },
    onSuccess: async (data) => {
      toast.success("Service status updated successfully", { id: "service-status" })
    },
    onError: (error, variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(['services'], context.previousServices)
      }
      console.error("Failed to update service status", error)
      toast.error("Failed to update service status", { id: "service-status" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      })
    }
  })
}