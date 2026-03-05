"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BookingInput, BookingInputSchema } from "@/features/booking/utils/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAvailableSlots, useCreateBooking } from "../../client/hooks/use-booking"
import { SerializedService } from "@/features/service/types"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { cn, isAxiosError } from "@/lib/utils"
import { User } from "@generated/prisma/client"
import { useMemo } from "react"
import { getMinBookingDate } from "../../utils/helpers"



export default function CreateBookingForm({
  user,
  services,
  onCancel,
  onSuccess
}: {
  user: User,
  services: SerializedService[];
  onCancel: () => void;
  onSuccess: () => void;
}) {

  const form = useForm<BookingInput>({
    resolver: zodResolver(BookingInputSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceId: '',
      bookingDate: '',
      bookingTime: '',
      minDepositPercent: undefined,
      createdById: user.id,
    }
  })

  const date = form.watch("bookingDate")
  const minDepositPercent = form.watch("minDepositPercent")
  const serviceId = form.watch("serviceId")
  const selectedService = useMemo(() => services?.find((service) => service.id === serviceId), [serviceId])



  const { data, isLoading, error } = useAvailableSlots(date, serviceId, user.id)
  const slots = data?.slots ?? []

  console.log("SLOTS", slots)

  // const mutation = useMutation({
  //   mutationFn: createOrEditBooking,
  //   onSuccess: (data) => {
  //     console.log('Successfully created Booking', data)
  //     toast("New Booking Created!")
  //     // onSuccess()
  //   }
  // })

  const mutation = useCreateBooking();

  const onSubmit = async (data: BookingInput) => {
    await mutation.mutateAsync(data)
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full ">
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


          {/* Payment */}
          <FormField
            control={form.control}
            name="minDepositPercent"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">Minimum deposit (%)</Label>
                <Input className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg" step="0.01" type="number" min={0} max={100} {...field} />
                {form.formState.errors.minDepositPercent && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.minDepositPercent.message}
                  </p>
                )}
              </div>
            )}
          />
          {selectedService && (
            <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-600">
              <div className="flex gap-2 items-center ">
                <p className="font-semibold">Minimum deposit required: </p><span className="text-[20px] text-fuchsia-700 font-semibold">GHS {((Number(minDepositPercent) || selectedService.minDepositPercent) / 100) * Number(selectedService?.price)}</span>
              </div>
              <p className="font-normal text-sm">{Number(minDepositPercent) || selectedService.minDepositPercent}% of {Number(selectedService?.price)} total service price</p>
            </div>
          )}

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
                        onClick={() => field.onChange(slot.time)}
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

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6 flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">i</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">In-Person Payment</p>
              <p className="text-xs text-blue-600 mt-1">
                After creating the booking, use <strong>Charge Customer</strong> to open Paystack checkout on this device. The customer enters their card or MoMo details here.
              </p>
            </div>
          </div>
        </div>

        {/* Form Level Error */}
        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(mutation.error)
              ? mutation.error.response?.data?.message || mutation.error.message
              : "Failed to create booking"}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button className="shadow-none" variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-fuchsia-700 hover:bg-fuchsia-600"
          >
            {mutation.isPending ? 'Creating...' : 'Create booking'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
