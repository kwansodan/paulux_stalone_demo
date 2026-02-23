"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CancelBookingInput, CancelBookingSchema } from "@/features/booking/utils/validation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cancelBooking } from "../../client/hooks/use-booking"
import { BookingWithService } from "../../types"
import { isAxiosError } from "@/lib/utils"

export default function CancelBookingForm({
  booking,
  onCancel,
  onSuccess,
}: {
  booking: BookingWithService
  onCancel: () => void
  onSuccess: () => void
}) {
  const form = useForm<CancelBookingInput>({
    resolver: zodResolver(CancelBookingSchema),
    defaultValues: { reason: "" },
  })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CancelBookingInput) => cancelBooking(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings", booking.bookingDate],
      })
      toast("Booking cancelled!!")
      onSuccess()
    },
  })

  const onSubmit = async (data: CancelBookingInput) => {
    await mutation.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-1 space-y-3">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Cancellation Reason (optional)
                </Label>
                <Textarea
                  rows={8}
                  placeholder="Why is this booking being cancelled?"
                  className="bg-white h-27 border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.reason && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.reason.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(mutation.error)
              ? mutation.error.response?.data?.message || mutation.error.message
              : "Failed to cancel booking"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {mutation.isPending ? "Cancelling..." : "Cancel Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
