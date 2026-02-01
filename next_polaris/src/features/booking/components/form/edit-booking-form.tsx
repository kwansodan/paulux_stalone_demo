"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { BookingInput, BookingInputSchema } from "@/features/booking/utils/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createOrEditBooking, useAvailableSlots, useEditBooking } from "../../client/hooks/use-booking"
import { toast } from "sonner"
import { SerializedService } from "@/features/service/types"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { cn, isAxiosError } from "@/lib/utils"
import { User } from "@generated/prisma/client"
import { BookingWithService } from "../../types"

export default function EditBookingForm({
  booking,
  user,
  services,
  onCancel,
  onSuccess,
}: {
  booking: BookingWithService
  user: User
  services: SerializedService[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const form = useForm<BookingInput>({
    resolver: zodResolver(BookingInputSchema),
    defaultValues: {
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      serviceId: booking.serviceId,
      bookingDate: booking.bookingDate.slice(0, 10),
      bookingTime: booking.bookingTime,
      createdById: user.id,
      status: booking.status
    },
  })

  const date = form.watch("bookingDate")
  const serviceId = form.watch("serviceId")

  const { data, isLoading, error } = useAvailableSlots(date, serviceId)
  const slots = data?.slots ?? []

  const mutation = useEditBooking()

  const onSubmit = async (data: BookingInput) => {
    await mutation.mutateAsync({
      ...data,
      id: booking.id,
    })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-1 space-y-4">

          {/* Customer Name */}
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Customer name"
                  className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.clientName && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Customer Email */}
          <FormField
            control={form.control}
            name="clientEmail"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Customer Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Customer email"
                  type="email"
                  className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.clientEmail && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.clientEmail.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Customer Phone */}
          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Customer Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Customer phone"
                  className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.clientPhone && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.clientPhone.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Booking Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Booking Status
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="min-h-12 w-full bg-white shadow-none border-[#E2E8F0] rounded-lg">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {form.formState.errors.status && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
            )}
          />


          {/* Service Selection */}
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Service <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="min-h-12 w-full bg-white shadow-none border-[#E2E8F0] rounded-lg">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="mt-12">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.serviceId && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.serviceId.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Booking Date */}
          <FormField
            control={form.control}
            name="bookingDate"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Booking Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  {...field}
                />
                {form.formState.errors.bookingDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.bookingDate.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Booking Time Slots */}
          <FormField
            control={form.control}
            name="bookingTime"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Booking Time <span className="text-red-500">*</span>
                </Label>

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
                  </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-600">
                      Failed to load available times. Please try again.
                    </p>
                  </div>
                )}

                {/* Slots Grid */}
                {!isLoading && !error && slots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot: { available: boolean; time: string }) => (
                      <Button
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        className={cn(
                          "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
                          field.value === slot.time && 'bg-fuchsia-500 hover:bg-fuchsia-600',
                          ((slot.available && !field.value) || (field.value !== slot.time)) && 'bg-fuchsia-200 hover:bg-fuchsia-300 text-black',
                          !slot.available && 'bg-gray-500'
                        )}
                        onClick={() => {
                          if (field.value === slot.time) {
                            field.onChange(null)
                          } else {
                            field.onChange(slot.time)
                          }
                        }}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}

                {/* No Slots Available */}
                {!isLoading && !error && slots.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No booking times available for booking date selected
                  </p>
                )}

                {/* Form Validation Error */}
                {form.formState.errors.bookingTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.bookingTime.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {/* Form Level Error */}
        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(mutation.error)
              ? mutation.error.response?.data?.message || mutation.error.message
              : "Failed to edit booking"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Update booking"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
