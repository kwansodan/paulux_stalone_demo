import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookingInput, BookingStatusEnum, BookingStatusInput, CancelBookingInput } from "../../utils/validation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { BookingStatus } from "@generated/prisma/enums";


export const createOrEditBooking = async (data: BookingInput & { id?: string }) => {
  const res = await api.post("/bookings", data)
  return res.data;
}

export function cancelBooking(id: string, payload: CancelBookingInput) {
  return api.post(`/bookings/${id}/cancel`, payload)
}

export function updateBookingStatus(id: string, payload: BookingStatusInput) {
  return api.post(`/bookings/${id}/status`, payload)
}


export function useAvailableSlots(date?: string, serviceId?: string) {
  return useQuery({
    queryKey: ["slots", date, serviceId],
    enabled: !!date && !!serviceId,
    queryFn: async () => {
      const res = await api.get(`/bookings/availability?date=${date}&serviceId=${serviceId}`)
      return res.data
    },
  })
}


export function useGetBookingsByDate(dateStr: string) {
  return useQuery({
    queryKey: ["bookings", dateStr],
    queryFn: async () => {
      const res = await api.get(`/bookings?date=${dateStr}`)
      return res.data
    }
  })
}



export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots", data.data.bookingDate, data.data.serviceId],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.data.bookingDate],
      })

      // console.log('Successfully created Booking', data)
      toast.success("Booking created successfully!")
    },
    onError: (error) => {
      console.error("Failed to create booking", error)
      toast.error("Failed to create booking")
    },
  })
}

export function useEditBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots", data.data.bookingDate, data.data.serviceId],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.data.bookingDate],
      })

      // console.log('Successfully created Booking', data)
      toast("Booking updated successfully")
    },
    onError: (error) => {
      console.error("Failed to edit booking", error)
      toast.error("Failed to edit booking")
    },
  })
}

export function useMarkAsCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, { status: BookingStatus.COMPLETED}),
    onMutate: () => {
      toast.loading("Updating booking status...", { id: "booking-status" })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots", data.data.bookingDate, data.data.serviceId],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.data.bookingDate],
      })

      // console.log('Successfully created Booking', data)
      toast.success("Booking status updated successfully", { id: "booking-status" })
    },
    onError: (error) => {
      console.error("Failed to update booking status", error)
      toast.error("Failed to update booking status", { id: "booking-status" })
    },
  })
}

