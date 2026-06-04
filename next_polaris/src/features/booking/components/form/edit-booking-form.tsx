"use client"

import { useState, useMemo } from "react"
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
import { SerializedProduct } from "@/features/product/types"
import { Form, FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { cn, isAxiosError } from "@/lib/utils"
import { User } from "@generated/prisma/client"
import { BookingWithService } from "../../types"
import { ShoppingBag, Minus, Plus } from "lucide-react"

export default function EditBookingForm({
  booking,
  user,
  services,
  products,
  onCancel,
  onSuccess,
}: {
  booking: BookingWithService
  user: User
  services: SerializedService[]
  products: SerializedProduct[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const form = useForm<BookingInput>({
    resolver: zodResolver(BookingInputSchema),
    defaultValues: {
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      serviceIds: booking.services.map(s => ({ id: s.serviceId, quantity: (s as any).quantity ?? 1 })),
      productIds: booking.products?.map(p => ({ id: p.productId, quantity: p.quantity ?? 1 })) ?? [],
      bookingDate: booking.bookingDate.slice(0, 10),
      bookingTime: booking.bookingTime,
      createdById: user.id,
      status: booking.status
    },
  })

  const date = form.watch("bookingDate")
  const serviceEntries = (form.watch("serviceIds") || []).map(
    (s) => ({ id: s.id, quantity: s.quantity ?? 1 })
  )
  const serviceIds = serviceEntries.map(e => e.id)
  const productEntries = form.watch("productIds") || []
  const userId = form.watch("createdById") || user.id

  const { data, isLoading, error } = useAvailableSlots(date, serviceIds.length > 0 ? serviceIds : undefined, userId)
  const slots = data?.slots ?? []

  const mutation = useEditBooking()

  const [serviceSearch, setServiceSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const filteredForDisplay = useMemo(() =>
    services.filter((s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase())
    ),
    [serviceSearch, services]
  )
  const filteredProducts = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    ),
    [productSearch, products]
  )

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
            name="serviceIds"
            render={({ field }) => {
              const entries = (field.value || []).map(
                (s) => ({ id: s.id, quantity: s.quantity ?? 1 })
              )
              function isSelected(id: string) { return entries.some((e: any) => e.id === id) }
              function toggleService(id: string) {
                if (isSelected(id)) {
                  field.onChange(entries.filter((e: any) => e.id !== id))
                } else {
                  field.onChange([...entries, { id, quantity: 1 }])
                }
              }
              function changeQty(id: string, delta: number) {
                field.onChange(
                  entries.map((e: any) =>
                    e.id === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e
                  )
                )
              }
              return (
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-foreground">
                    Services <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md mb-1 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                  />
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg bg-white">
                    {filteredForDisplay.map((s) => {
                      const selected = isSelected(s.id)
                      const qty = entries.find((e: any) => e.id === s.id)?.quantity ?? 1
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                          <div
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${selected ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-gray-300'}`}
                            onClick={() => toggleService(s.id)}
                          >
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 text-sm cursor-pointer" onClick={() => toggleService(s.id)}>
                            {s.name}
                          </div>
                          {selected && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button type="button" onClick={() => changeQty(s.id, -1)} className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{qty}</span>
                              <button type="button" onClick={() => changeQty(s.id, 1)} className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <span className="text-fuchsia-600 font-medium text-sm whitespace-nowrap ml-1">
                            GHS {(Number(s.price) * (selected ? qty : 1)).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {form.formState.errors.serviceIds && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.serviceIds.message}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Products */}
          {products.length > 0 && (
            <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => {
                const entries = (field.value || []).map(e => ({ id: e.id, quantity: e.quantity ?? 1 }))

                function isSelected(id: string) {
                  return entries.some(e => e.id === id)
                }

                function toggleProduct(id: string) {
                  if (isSelected(id)) {
                    field.onChange(entries.filter(e => e.id !== id))
                  } else {
                    field.onChange([...entries, { id, quantity: 1 }])
                  }
                }

                function changeQty(id: string, delta: number) {
                  field.onChange(
                    entries.map(e =>
                      e.id === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e
                    )
                  )
                }

                return (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal text-foreground flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-fuchsia-600" />
                      Products <span className="text-gray-400 text-xs">(optional)</span>
                    </Label>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-md mb-1 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                    />
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg bg-white">
                      {filteredProducts.map((p) => {
                        const selected = isSelected(p.id)
                        const qty = entries.find(e => e.id === p.id)?.quantity ?? 1
                        return (
                          <div key={p.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                            <div
                              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${selected ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-gray-300'}`}
                              onClick={() => toggleProduct(p.id)}
                            >
                              {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 text-sm cursor-pointer" onClick={() => toggleProduct(p.id)}>
                              {p.name}
                            </div>
                            {selected && (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => changeQty(p.id, -1)}
                                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(p.id, 1)}
                                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <span className="text-fuchsia-600 font-medium text-sm whitespace-nowrap ml-1">
                              GHS {(Number(p.price) * (selected ? qty : 1)).toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                      {filteredProducts.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                      )}
                    </div>
                    {entries.length > 0 && (
                      <p className="text-xs text-fuchsia-600 font-medium">
                        {entries.length} product{entries.length !== 1 ? 's' : ''} selected — GHS{' '}
                        {products
                          .filter(p => isSelected(p.id))
                          .reduce((sum, p) => sum + Number(p.price) * (entries.find(e => e.id === p.id)?.quantity ?? 1), 0)
                          .toFixed(2)}
                      </p>
                    )}
                  </div>
                )
              }}
            />
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
              ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
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
