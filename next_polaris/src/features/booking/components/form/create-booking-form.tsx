"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BookingInput, BookingInputSchema } from "@/features/booking/utils/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAvailableSlots, useCreateBooking } from "../../client/hooks/use-booking"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { cn, isAxiosError } from "@/lib/utils"
import { User } from "@generated/prisma/client"
import { useMemo, useState } from "react"
import { CalendarClock, UserRound, Info, ShoppingBag } from "lucide-react"



export default function CreateBookingForm({
  user,
  services,
  products,
  onCancel,
  onSuccess
}: {
  user: User,
  services: SerializedService[];
  products: SerializedProduct[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [bookingType, setBookingType] = useState<"SCHEDULED" | "WALKIN">("SCHEDULED")
  const isWalkIn = bookingType === "WALKIN"

  const form = useForm<BookingInput>({
    resolver: zodResolver(BookingInputSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceIds: [],
      productIds: [],
      bookingDate: undefined,
      bookingTime: undefined,
      minDepositFixed: undefined,
      createdById: user.id,
      bookingType: "SCHEDULED",
    }
  })

  const date = form.watch("bookingDate")
  const minDepositFixed = form.watch("minDepositFixed")
  const serviceIds = form.watch("serviceIds") || []
  const productIds = form.watch("productIds") || []
  const selectedServices = useMemo(() => services?.filter((service) => serviceIds.includes(service.id)), [serviceIds, services])
  const selectedProducts = useMemo(() => products.filter((p) => productIds.includes(p.id)), [productIds, products])
  const [searchTerm, setSearchTerm] = useState('')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [services, searchTerm])
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
  }, [products, productSearchTerm])

  const { data, isLoading, error } = useAvailableSlots(
    !isWalkIn ? date : undefined,
    !isWalkIn && serviceIds.length > 0 ? serviceIds : undefined,
    user.id
  )
  const slots = data?.slots ?? []

  const mutation = useCreateBooking();

  const onSubmit = async (data: BookingInput) => {
    await mutation.mutateAsync({ ...data, bookingType })
    onSuccess()
  }

  function handleTypeSwitch(type: "SCHEDULED" | "WALKIN") {
    setBookingType(type)
    // Clear date/time when switching to walk-in
    if (type === "WALKIN") {
      form.setValue("bookingDate", undefined)
      form.setValue("bookingTime", undefined)
      form.clearErrors(["bookingDate", "bookingTime"])
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full ">
        <div className="flex-1 overflow-y-auto px-1 space-y-4">

          {/* ── Booking Type Toggle ── */}
          <div className="space-y-1.5">
            <Label className="text-sm font-normal text-foreground">Booking Type</Label>
            <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden bg-white h-11">
              <button
                type="button"
                onClick={() => handleTypeSwitch("SCHEDULED")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                  !isWalkIn
                    ? "bg-fuchsia-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <CalendarClock className="w-4 h-4" />
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch("WALKIN")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors border-l border-[#E2E8F0]",
                  isWalkIn
                    ? "bg-amber-500 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <UserRound className="w-4 h-4" />
                Walk-in
              </button>
            </div>
          </div>

          {/* Walk-in info banner */}
          {isWalkIn && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Walk-in booking</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Date and time will be set to now. The booking will be immediately confirmed.
                  Name and email are optional for walk-in customers.
                </p>
              </div>
            </div>
          )}

          {/* Customer Name */}
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">
                  Customer Name {!isWalkIn && <span className="text-red-500">*</span>}
                  {isWalkIn && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                </Label>
                <Input
                  placeholder={isWalkIn ? "Walk-in Guest" : "Customer name"}
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
                  Customer Email {!isWalkIn && <span className="text-red-500">*</span>}
                  {isWalkIn && <span className="text-gray-400 text-xs ml-1">(optional — needed for Paystack)</span>}
                </Label>
                <Input
                  placeholder={isWalkIn ? "Leave blank to use walk-in email" : "Customer email"}
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
            name="serviceIds"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="text-sm font-normal text-foreground">
                  Services <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg bg-white">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            const current = field.value || [];
                            const next = current.includes(s.id)
                              ? current.filter((v) => v !== s.id)
                              : [...current, s.id];
                            field.onChange(next);
                          }}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${field.value?.includes(s.id) ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-gray-300'}`}>
                            {field.value?.includes(s.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex justify-between items-center text-sm">
                            <span>{s.name}</span>
                            <span className="text-fuchsia-600 font-medium whitespace-nowrap ml-2">GHS {Number(s.price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No services found
                      </div>
                    )}
                  </div>
                </div>
                {form.formState.errors.serviceIds && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.serviceIds.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Payment / Deposit */}
          <FormField
            control={form.control}
            name="minDepositFixed"
            render={({ field }) => (
              <div className="space-y-1">
                <Label className="text-sm font-normal text-foreground">Minimum deposit (GHS)</Label>
                <Input className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg" step="0.01" type="number" min={0} {...field} />
                {form.formState.errors.minDepositFixed && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.minDepositFixed.message}
                  </p>
                )}
              </div>
            )}
          />
          {/* Products */}
          {products.length > 0 && (
            <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-foreground flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-fuchsia-600" />
                    Products <span className="text-gray-400 text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="Search products..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="h-10 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg bg-white">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            const current = field.value || []
                            const next = current.includes(p.id)
                              ? current.filter((v) => v !== p.id)
                              : [...current, p.id]
                            field.onChange(next)
                          }}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${field.value?.includes(p.id) ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-gray-300'}`}>
                            {field.value?.includes(p.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex justify-between items-center text-sm">
                            <span>{p.name}</span>
                            <span className="text-fuchsia-600 font-medium whitespace-nowrap ml-2">GHS {Number(p.price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                    )}
                  </div>
                </div>
              )}
            />
          )}

          {/* Booking summary */}
          {selectedServices && selectedServices.length > 0 && (
            <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-600 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Services:</span>
                <span className="font-medium">GHS {selectedServices.reduce((sum, s) => sum + Number(s.price), 0).toFixed(2)}</span>
              </div>
              {selectedProducts.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-medium">GHS {selectedProducts.reduce((sum, p) => sum + Number(p.price), 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm border-t border-fuchsia-200 pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">GHS {(selectedServices.reduce((sum, s) => sum + Number(s.price), 0) + selectedProducts.reduce((sum, p) => sum + Number(p.price), 0)).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 items-center">
                <p className="font-semibold text-sm">Minimum deposit required: </p>
                <span className="text-[18px] text-fuchsia-700 font-semibold">
                  GHS {
                    minDepositFixed !== undefined
                      ? Number(minDepositFixed).toFixed(2)
                      : selectedServices.reduce((sum, s) => sum + Number(s.minDepositFixed), 0).toFixed(2)
                  }
                </span>
              </div>
            </div>
          )}

          {/* Date & Time — only shown for scheduled bookings */}
          {!isWalkIn && (
            <>
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

                    {isLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fuchsia-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
                      </div>
                    )}

                    {error && !isLoading && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-600">
                          Failed to load available times. Please try again.
                        </p>
                      </div>
                    )}

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

                    {!isLoading && !error && slots.length === 0 && (
                      <p className="text-sm text-gray-400">
                        No booking times available for booking date selected
                      </p>
                    )}

                    {form.formState.errors.bookingTime && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.bookingTime.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6 flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">i</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">In-Person Payment</p>
              <p className="text-xs text-blue-600 mt-1">
                {isWalkIn
                  ? <>Use <strong>Cash</strong> to mark as paid immediately, or <strong>Charge Customer</strong> to open Paystack checkout on this device.</>
                  : <>After creating the booking, use <strong>Charge Customer</strong> to open Paystack checkout on this device. The customer enters their MoMo details here.</>
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Level Error */}
        {mutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(mutation.error)
              ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
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
            className={cn(
              isWalkIn ? "bg-amber-500 hover:bg-amber-600" : "bg-fuchsia-700 hover:bg-fuchsia-600"
            )}
          >
            {mutation.isPending ? 'Creating...' : isWalkIn ? 'Create Walk-in' : 'Create booking'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
