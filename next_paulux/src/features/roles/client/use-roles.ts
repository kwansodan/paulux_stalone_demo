import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { RoleWithCount } from "../types"

export function useGetRoles() {
  return useQuery<RoleWithCount[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles")
      return res.data.data
    },
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; permissions: string[] }) => {
      const res = await api.post("/roles", payload)
      return res.data.data as RoleWithCount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role created")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to create role")
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string; name?: string; description?: string | null; permissions?: string[] }) => {
      const res = await api.put(`/roles/${id}`, payload)
      return res.data.data as RoleWithCount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Role updated")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update role")
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      toast.success("Role deleted")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete role")
    },
  })
}
