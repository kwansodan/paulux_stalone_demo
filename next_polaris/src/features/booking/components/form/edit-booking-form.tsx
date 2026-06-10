"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { calculateBookingTotal } from "../../utils/helpers"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"
import { PaymentStatus } from "@/features/payment/types"
import { ShoppingBag, Minus, Plus, Tag, CheckCircle2, Gift } from "lucide-react"

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
      clientEmail: booking.clientEmail ?? "",
      clientPhone: booking.clientPhone,
      serviceIds: booking.services.map(s => ({ id: s.serviceId, quantity: (s as any).quantity ?? 1 })),
      productIds: booking.products?.map(p => ({ id: p.productId, quantity: p.quantity ?? 1 })) ?? [],
      bookingDate: booking.bookingDate.slice(0, 10),
      bookingTime: booking.bookingTime,
      createdById: user.id,
      status: booking.status,
      bookingType: booking.bookingType,
    },
  })

  const date = form.watch("bookingDate")
  const serviceEntries = (form.watch("serviceIds") || []).map(
    (s) => ({ id: s.id, quantity: s.quantity ?? 1 })
  )
  const serviceIds = serviceEntries.map(e => e.id)
  const productEntries = form.watch("productIds") || []
  const userId = form.watch("createdById") || user.id

  const selectedServices = useMemo(
    () => services?.filter((service) => serviceIds.includes(service.id)),
    [serviceIds, services]
  )
  const selectedProducts = useMemo(
    () => products
      .filter(p => productEntries.some(e => e.id === p.id))
      .map(p => ({ ...p, quantity: productEntries.find(e => e.id === p.id)?.quantity ?? 1 })),
    [productEntries, products]
  )

  // Promo code — only relevant for bookings that didn't have one applied at creation
  const existingPromo = booking.promoCodeId && (booking as any).promoCode
    ? {
        code: (booking as any).promoCode.code as string,
        discountAmount: Number(booking.discountAmount ?? 0),
      }
    : null

  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<{
    promoCodeId: string
    code: string
    discountAmount: number
    discountType: string
    discountValue: number
  } | null>(null)

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    const servicesTotal = selectedServices.reduce((sum, s) => {
      const qty = serviceEntries.find((e) => e.id === s.id)?.quantity ?? 1
      return sum + Number(s.price) * qty
    }, 0)
    const productsTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)
    const baseTotal = servicesTotal + productsTotal
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), bookingTotal: baseTotal }),
      })
      const resData = await res.json()
      if (resData.valid) {
        setAppliedPromo({
          promoCodeId: resData.promoCodeId,
          code: promoInput.trim().toUpperCase(),
          discountAmount: resData.discountAmount,
          discountType: resData.discountType,
          discountValue: resData.discountValue,
        })
        form.setValue("promoCodeId", resData.promoCodeId)
        form.setValue("discountAmount", resData.discountAmount)
        setPromoInput("")
      } else {
        setPromoError(resData.message || "Invalid promo code")
      }
    } catch {
      setPromoError("Failed to validate promo code. Please try again.")
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoError(null)
    form.setValue("promoCodeId", undefined)
    form.setValue("discountAmount", undefined)
  }

  // Gift card redemption — applies a gift card's balance directly against this booking's
  // outstanding amount. Unlike promo codes, this is a side-effecting action (it updates the
  // gift card balance and records a payment), so it's executed immediately rather than on save.
  const queryClient = useQueryClient()
  const [giftCardInput, setGiftCardInput] = useState("")
  const [giftCardLoading, setGiftCardLoading] = useState(false)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [giftCardResult, setGiftCardResult] = useState<{ code: string; amountApplied: number } | null>(null)

  const bookingTotal = calculateBookingTotal(booking as any)
  const paidPayments = booking.payments?.filter((p: any) => p.status === "PAID") || []
  const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  const remainingBalance = Math.max(0, bookingTotal - totalPaid)
  const currentPaymentStatus = calculatePaymentStatus(booking as any)

  const handleRedeemGiftCard = async () => {
    if (!giftCardInput.trim()) return
    setGiftCardLoading(true)
    setGiftCardError(null)
    try {
      const validateRes = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardInput.trim() }),
      })
      const validateData = await validateRes.json()
      if (!validateData.valid) {
        setGiftCardError(validateData.message || "Invalid gift card code")
        return
      }

      const redeemRes = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: validateData.code,
          bookingId: booking.id,
          amount: validateData.balance,
        }),
      })
      const redeemData = await redeemRes.json()
      if (!redeemRes.ok || !redeemData.success) {
        setGiftCardError(redeemData.message || "Failed to redeem gift card")
        return
      }

      setGiftCardResult({ code: validateData.code, amountApplied: redeemData.data.amountApplied })
      setGiftCardInput("")
      toast.success(`Applied GHS ${Number(redeemData.data.amountApplied).toFixed(2)} from gift card ${validateData.code}`)
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["booking", booking.id] })
    } catch {
      setGiftCardError("Failed to redeem gift card. Please try again.")
    } finally {
      setGiftCardLoading(false)
    }
  }

  const { data, isLoading, error } = useAvailableSlots(date, serviceIds.length > 0 ? serviceIds : undefined, userId)
  const slots = data?.slots ?? []

  const mutation = useEditBooking()
  const isWalkIn = booking.bookingType === "WALKIN"

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
      bookingType: booking.bookingType,
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
                  Customer Name {!isWalkIn && <span className="text-red-500">*</span>}
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
                  Customer Email {!isWalkIn && <span className="text-red-500">*</span>}
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

          {/* Booking summary + promo code */}
          {selectedServices && selectedServices.length > 0 && (() => {
            const servicesTotal = selectedServices.reduce((sum, s) => {
              const qty = serviceEntries.find((e) => e.id === s.id)?.quantity ?? 1
              return sum + Number(s.price) * qty
            }, 0)
            const productsTotal = selectedProducts.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)
            const baseTotal = servicesTotal + productsTotal
            const discountAmt = existingPromo?.discountAmount ?? appliedPromo?.discountAmount ?? 0
            const finalTotal = Math.max(0, baseTotal - discountAmt)
            return (
              <div className="space-y-3">
                <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-600 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Services:</span>
                    <span className="font-medium">GHS {servicesTotal.toFixed(2)}</span>
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Products:</span>
                      <span className="font-medium">GHS {productsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {(existingPromo || appliedPromo) && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Discount ({(existingPromo ?? appliedPromo)!.code}):</span>
                      <span>- GHS {discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm border-t border-fuchsia-200 pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">GHS {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo Code — only editable if no promo was applied at creation */}
                {existingPromo ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-700">{existingPromo.code}</p>
                        <p className="text-xs text-green-600">
                          Applied at booking creation — saves GHS {existingPromo.discountAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!appliedPromo ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-fuchsia-500" />
                          Promo Code <span className="text-gray-400 text-xs font-normal">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter code"
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null) }}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                            className="h-10 bg-white border-[#E2E8F0] rounded-lg uppercase placeholder:normal-case shadow-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyPromo}
                            disabled={promoLoading || !promoInput.trim()}
                            className="rounded-lg border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50 px-4 flex-shrink-0"
                          >
                            {promoLoading ? "..." : "Apply"}
                          </Button>
                        </div>
                        {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-green-700">{appliedPromo.code}</p>
                            <p className="text-xs text-green-600">
                              Saves GHS {appliedPromo.discountAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-xs text-gray-500 hover:text-red-500 underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Gift Card Redemption — apply a customer's gift card balance toward the outstanding amount */}
          {currentPaymentStatus !== PaymentStatus.PAID && remainingBalance > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-fuchsia-500" />
                Redeem Gift Card <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-500">
                Outstanding balance: GHS {remainingBalance.toFixed(2)}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter gift card code"
                  value={giftCardInput}
                  onChange={(e) => { setGiftCardInput(e.target.value.toUpperCase()); setGiftCardError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleRedeemGiftCard())}
                  className="h-10 bg-white border-[#E2E8F0] rounded-lg uppercase placeholder:normal-case shadow-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRedeemGiftCard}
                  disabled={giftCardLoading || !giftCardInput.trim()}
                  className="rounded-lg border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50 px-4 flex-shrink-0"
                >
                  {giftCardLoading ? "..." : "Redeem"}
                </Button>
              </div>
              {giftCardError && <p className="text-xs text-red-500">{giftCardError}</p>}
              {giftCardResult && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-600">
                    Applied GHS {giftCardResult.amountApplied.toFixed(2)} from gift card {giftCardResult.code}
                  </p>
                </div>
              )}
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
