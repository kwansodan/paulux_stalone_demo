import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookingInput, BookingStatusEnum, BookingStatusInput, CancelBookingInput } from "../../utils/validation";
import { api, publicApi } from "@/lib/api";
import { toast } from "sonner";
import { BookingStatus } from "@generated/prisma/enums";
import { BookingFilters, BookingWithService, IBookingMetrics } from "../../types";


export const createOrEditBooking = async (data: BookingInput & { id?: string }) => {
  const res = await api.post("/bookings", data)
  return res.data.data;
}

export function cancelBooking(id: string, payload: CancelBookingInput) {
  return api.post(`/bookings/${id}/cancel`, payload)
}

export function updateBookingStatus(id: string, payload: BookingStatusInput) {
  return api.post(`/bookings/${id}/status`, payload)
}


export function useAvailableSlots(date?: string, serviceIds?: string[], userId?: string) {
  return useQuery({
    queryKey: ["slots", date, serviceIds?.join(',')],
    enabled: !!date && !!serviceIds && serviceIds.length > 0,
    queryFn: async () => {
      const ids = serviceIds?.join(',')
      let path = `/bookings/availability?date=${date}&serviceIds=${ids}`
      if (userId) path = path + `&userId=${userId}`
      const res = await api.get(path)
      return res.data
    },
  })
}


export function useGetBookingsById(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}`)
      return res.data
    }
  })
}

export function useGetBookingsByDate(dateStr: string) {
  return useQuery({
    queryKey: ["bookings", dateStr],
    queryFn: async () => {
      const res = await api.get(`/bookings?date=${dateStr}`)
      return res.data
    },
    refetchOnWindowFocus: true,
  })
}

export function useBookings(filters: Partial<BookingFilters>) {
  return useQuery({
    queryKey: ["reports-bookings",
      filters.from,
      filters.to,
      filters.status,
      filters.paymentStatus,
      filters.search,
      filters.time],
    queryFn: async () => {
      const res = await api.get("/bookings", { params: filters })
      return res.data.data.bookings
    },
    refetchOnMount: false,
  })
}


export function useBookingMetrics(initial: IBookingMetrics) {
  return useQuery({
    queryKey: ["booking-metrics"],
    queryFn: async () => {
      const res = await api.get("/bookings", { params: { includeCount: true } })
      const { bookings, count }: { bookings: BookingWithService[]; count: number } = res.data.data;

      const metrics = {
        totalBookings: count ?? bookings.length,
        cancelled: bookings.filter(b => b.status === "CANCELLED").length,
        unpaid: bookings.filter(b => b.paymentStatus !== "PAID").length,
        completed: bookings.filter(b => b.status === "COMPLETED").length,
      }

      return metrics
    },
    initialData: initial,
  })
}



export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots"],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.bookingDate],
      })

      // console.log('Successfully created Booking', data)
      toast.success("Booking created successfully!")
      return data
    },
    onError: (error: any) => {
      console.error("Failed to create booking", error)
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to create booking"
      toast.error(message)
    },
  })
}

type PublicReschedulePayload = {
  id: string
  bookingDate: string
  bookingTime: string
}

export function usePublicRescheduleBooking() {
  return useMutation({
    mutationFn: async ({ id, bookingDate, bookingTime }: PublicReschedulePayload) => {
      const res = await publicApi.post(`/bookings/${id}/reschedule`, {
        bookingDate,
        bookingTime,
      })
      return res.data
    },
    onMutate: () => {
      toast.loading("Rescheduling booking...", { id: "reschedule-booking" })
    },
    onSuccess: () => {
      toast.success("Booking rescheduled successfully", { id: "reschedule-booking" })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to reschedule booking"
      toast.error(message, { id: "reschedule-booking" })
    },
  })
}

export function useEditBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrEditBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots"],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.bookingDate],
      })

      // console.log('Successfully created Booking', data)
      toast("Booking updated successfully")
    },
    onError: (error: any) => {
      console.error("Failed to edit booking", error)
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to edit booking"
      toast.error(message)
    },
  })
}

export function useMarkAsCompleted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, { status: BookingStatus.COMPLETED }),
    onMutate: () => {
      toast.loading("Updating booking status...", { id: "booking-status" })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots"],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.data.data.bookingDate],
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

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => updateBookingStatus(id, { status: BookingStatus.CANCELLED }),
    onMutate: () => {
      toast.loading("Updating booking status...", { id: "booking-status" })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["slots"],
      })

      queryClient.invalidateQueries({
        queryKey: ["bookings", data.data.data.booking.bookingDate],
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

export function useChargeCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      api.post(`/bookings/${id}/charge`, amount !== undefined ? { amount } : {}),
    onMutate: () => {
      toast.loading("Initializing payment...", { id: "charge-customer" })
    },
    onSuccess: (data) => {
      const paymentUrl = data.data?.data?.paymentUrl
      if (paymentUrl) {
        toast.dismiss("charge-customer")
        window.location.href = paymentUrl
      } else {
        toast.error("No payment URL received", { id: "charge-customer" })
      }
    },
    onError: (error: any) => {
      console.error("Failed to charge customer", error)
      const message = error.response?.data?.message || "Failed to charge customer"
      toast.error(message, { id: "charge-customer" })
    },
  })
}

export function useRecheckPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/recheck-payment`),
    onMutate: () => {
      toast.loading("Checking with Paystack...", { id: "recheck-payment" })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["reports-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      toast.success(data?.data?.message || "Payment status refreshed", { id: "recheck-payment" })
    },
    onError: (error: any) => {
      console.error("Failed to recheck payment", error)
      const message = error.response?.data?.message || "Failed to recheck payment with Paystack"
      toast.error(message, { id: "recheck-payment" })
    },
  })
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, amount, methodId }: { id: string; amount?: number; methodId?: string }) => {
      const body: Record<string, unknown> = {}
      if (amount !== undefined) body.amount = amount
      if (methodId !== undefined) body.methodId = methodId
      return api.post(`/bookings/${id}/mark-as-paid`, body)
    },
    onMutate: () => {
      toast.loading("Recording payment...", { id: "mark-as-paid" })
    },
    onSuccess: (_data: any, variables: { id: string; amount?: number; methodId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["slots"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["reports-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["booking", variables.id] })
      toast.success("Payment recorded successfully", { id: "mark-as-paid" })
    },
    onError: (error: any) => {
      console.error("Failed to record payment", error)
      const message = error.response?.data?.message || "Failed to record payment"
      toast.error(message, { id: "mark-as-paid" })
    },
  })
}
