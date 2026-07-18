import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { StaffMember } from "../types"

export function useGetStaff() {
  return useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get("/staff")
      return res.data.data
    },
  })
}

// Stylists only — for the assign-stylist dropdown. Reachable with bookings.view
// (the full staff list is settings-gated).
export function useGetStylists() {
  return useQuery<StaffMember[]>({
    queryKey: ["staff", "stylists"],
    queryFn: async () => {
      const res = await api.get("/staff?stylistsOnly=true")
      return res.data.data
    },
  })
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; customRoleId?: string | null; isStylist?: boolean }) => {
      const res = await api.patch(`/staff/${id}`, patch)
      return res.data.data as StaffMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      toast.success("Staff member updated")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update staff member")
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      username: string
      email: string
      phone?: string
      isStylist?: boolean
      customRoleId?: string | null
    }) => {
      const res = await api.post("/staff", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to create staff member"
      toast.error(message)
    },
  })
}

export function useAssignStylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, stylistId }: { bookingId: string; stylistId: string | null }) => {
      const res = await api.patch(`/bookings/${bookingId}/assign`, { stylistId })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reports-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] })
      toast.success(variables.stylistId ? "Stylist assigned" : "Stylist removed")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to assign stylist"
      toast.error(message)
    },
  })
}

type ServiceAssignment = { serviceId: string; stylistId: string | null }

export function useAssignServiceStylists() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookingId, assignments }: { bookingId: string; assignments: ServiceAssignment[] }) => {
      const res = await api.patch(`/bookings/${bookingId}/assign-services`, { assignments })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reports-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] })
      toast.success("Stylist assignments saved")
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to save stylist assignments"
      toast.error(message)
    },
  })
}
