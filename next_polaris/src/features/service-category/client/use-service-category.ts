import { api } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SerializedServiceCategory } from "@/features/service/types"

export async function getServiceCategories(): Promise<SerializedServiceCategory[]> {
  const res = await api.get("/service-categories")
  return res.data.data
}

export function useGetServiceCategories() {
  return useQuery({
    queryKey: ["service-categories"],
    queryFn: getServiceCategories,
  })
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; capacity: number }) =>
      api.post("/service-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] })
      toast.success("Category created successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create category")
    },
  })
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; capacity?: number }) =>
      api.patch(`/service-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] })
      toast.success("Category updated successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update category")
    },
  })
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/service-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] })
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast.success("Category deleted successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete category")
    },
  })
}
