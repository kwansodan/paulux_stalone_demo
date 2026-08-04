import { api } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export type SerializedProductCategory = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  _count?: { products: number }
}

export async function getProductCategories(): Promise<SerializedProductCategory[]> {
  const res = await api.get("/product-categories")
  return res.data.data
}

export function useGetProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
  })
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) => api.post("/product-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
      toast.success("Category created successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create category")
    },
  })
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string }) =>
      api.patch(`/product-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
      toast.success("Category updated successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update category")
    },
  })
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/product-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Category deleted successfully!")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete category")
    },
  })
}
