import { api } from "@/lib/api"
import { ProductFormInput, ProductStatusInput } from "../utils/validation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SerializedProduct } from "../types"

export function createOrEditProduct(payload: ProductFormInput & { id?: string }) {
  return api.post("/products", payload)
}

export function deleteProduct(id: string) {
  return api.delete(`/products/${id}`)
}

export function updateProductStatus(id: string, payload: ProductStatusInput) {
  return api.post(`/products/${id}/status`, payload)
}

export async function getProducts(): Promise<SerializedProduct[]> {
  const res = await api.get("/products")
  return res.data.data
}

export function useGetProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(data.data.message || "Product deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete product")
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrEditProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully!")
    },
    onError: () => {
      toast.error("Failed to create product")
    },
  })
}

export function useEditProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrEditProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product updated successfully!")
    },
    onError: () => {
      toast.error("Failed to update product")
    },
  })
}

export function useUpdateStockTracking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, trackStock }: { ids: string[]; trackStock: boolean }) =>
      api.patch("/products/stock-tracking", { ids, trackStock }),
    onSuccess: (_, { trackStock }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(
        trackStock
          ? "Stock tracking enabled for selected products"
          : "Stock tracking disabled for selected products"
      )
    },
    onError: () => {
      toast.error("Failed to update stock tracking")
    },
  })
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      updateProductStatus(id, { isActive: status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] })
      const previous = queryClient.getQueryData<SerializedProduct[]>(["products"])
      queryClient.setQueryData(["products"], (old: SerializedProduct[] | undefined) => {
        if (!old) return old
        return old.map((p) => (p.id === id ? { ...p, isActive: status } : p))
      })
      toast.loading("Updating product status...", { id: "product-status" })
      return { previous }
    },
    onSuccess: () => {
      toast.success("Product status updated successfully", { id: "product-status" })
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["products"], context.previous)
      }
      toast.error("Failed to update product status", { id: "product-status" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}
