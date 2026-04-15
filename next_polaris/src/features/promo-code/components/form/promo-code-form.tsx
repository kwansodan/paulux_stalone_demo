"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SerializedPromoCode } from "../../types"
import { useCreatePromoCode, useUpdatePromoCode } from "../../client/use-promo-codes"
import { isAxiosError } from "@/lib/utils"

interface PromoCodeFormProps {
  promo?: SerializedPromoCode
  onCancel: () => void
  onSuccess: () => void
}

export default function PromoCodeForm({ promo, onCancel, onSuccess }: PromoCodeFormProps) {
  const isEdit = !!promo

  const [code, setCode] = useState(promo?.code ?? "")
  const [description, setDescription] = useState(promo?.description ?? "")
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(promo?.discountType ?? "PERCENTAGE")
  const [discountValue, setDiscountValue] = useState(promo ? String(Number(promo.discountValue)) : "")
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : "")
  const [expiresAt, setExpiresAt] = useState(
    promo?.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 16) : ""
  )
  const [minBookingAmount, setMinBookingAmount] = useState(
    promo?.minBookingAmount != null ? String(Number(promo.minBookingAmount)) : ""
  )
  const [isActive, setIsActive] = useState(promo?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreatePromoCode()
  const updateMutation = useUpdatePromoCode()
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!code.trim()) return setError("Code is required")
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      return setError("Discount value must be a positive number")
    }
    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      return setError("Percentage discount cannot exceed 100%")
    }

    const payload: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : null,
      isActive,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: promo.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess()
    } catch (err: any) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Something went wrong")
      } else {
        setError(err.message || "Something went wrong")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">
      {/* Code */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Promo Code *</label>
        <Input
          placeholder="e.g. SAVE20"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-xl uppercase"
        />
        <p className="text-xs text-gray-400">Code is case-insensitive — stored and matched in uppercase</p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Input
          placeholder="Optional internal note"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Discount Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Discount Type *</label>
        <div className="flex gap-3">
          {(["PERCENTAGE", "FIXED"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDiscountType(type)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                discountType === type
                  ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount (GHS)"}
            </button>
          ))}
        </div>
      </div>

      {/* Discount Value */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Discount Value * {discountType === "PERCENTAGE" ? "(0–100%)" : "(GHS)"}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            {discountType === "PERCENTAGE" ? "%" : "₵"}
          </span>
          <Input
            type="number"
            min="0"
            max={discountType === "PERCENTAGE" ? "100" : undefined}
            step="0.01"
            placeholder={discountType === "PERCENTAGE" ? "20" : "50.00"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="rounded-xl pl-8"
          />
        </div>
      </div>

      {/* Max Uses + Expiry row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Max Uses</label>
          <Input
            type="number"
            min="1"
            placeholder="Unlimited"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="rounded-xl"
          />
          <p className="text-xs text-gray-400">Leave blank for unlimited</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Expiry Date</label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-xl"
          />
          <p className="text-xs text-gray-400">Leave blank — never expires</p>
        </div>
      </div>

      {/* Min Booking Amount */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Minimum Booking Amount (GHS)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₵</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="No minimum"
            value={minBookingAmount}
            onChange={(e) => setMinBookingAmount(e.target.value)}
            className="rounded-xl pl-8"
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-gray-50 border border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-700">Active</p>
          <p className="text-xs text-gray-400">Inactive codes are hidden from customers</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-fuchsia-600" : "bg-gray-200"}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-full">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-full"
        >
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Code"}
        </Button>
      </div>
    </form>
  )
}
