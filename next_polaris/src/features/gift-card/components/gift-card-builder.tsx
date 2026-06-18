"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GiftCardDeliveryMethodType } from "@/features/gift-card/types"
import { MIN_GIFT_CARD_AMOUNT, MAX_GIFT_CARD_AMOUNT } from "@/features/gift-card/utils/validation"
import { giftCardSuccessPath } from "@/app/paths"
import {
  Gift,
  Mail,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react"

const PRESET_AMOUNTS = [100, 200, 300, 500, 1000]

export default function GiftCardBuilder() {
  const [amount, setAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")

  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [senderPhone, setSenderPhone] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [message, setMessage] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDeliveryMethodType>("EMAIL")

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The effective amount is whatever the custom field holds (if used),
  // otherwise the selected preset.
  const effectiveAmount = useMemo(() => {
    if (customAmount.trim() !== "") {
      const parsed = Number(customAmount)
      return Number.isFinite(parsed) ? parsed : null
    }
    return amount
  }, [customAmount, amount])

  const handlePreset = (value: number) => {
    setAmount(value)
    setCustomAmount("")
    setError(null)
  }

  const validate = (): string | null => {
    if (effectiveAmount === null || !Number.isFinite(effectiveAmount)) return "Choose or enter a gift amount"
    if (effectiveAmount < MIN_GIFT_CARD_AMOUNT) return `Minimum gift card amount is GHS ${MIN_GIFT_CARD_AMOUNT}`
    if (effectiveAmount > MAX_GIFT_CARD_AMOUNT) return `Maximum gift card amount is GHS ${MAX_GIFT_CARD_AMOUNT.toLocaleString()}`
    if (!senderName.trim() || senderName.trim().length < 2) return "Please enter your name"
    if (!senderEmail.trim()) return "Please enter your email address"
    if (!senderPhone.trim()) return "Please enter your phone number"
    if (!recipientName.trim() || recipientName.trim().length < 2) return "Please enter the recipient's name"
    if ((deliveryMethod === "EMAIL" || deliveryMethod === "BOTH") && !recipientEmail.trim()) {
      return "Recipient email is required for email delivery"
    }
    if ((deliveryMethod === "SMS" || deliveryMethod === "BOTH") && !recipientPhone.trim()) {
      return "Recipient phone is required for SMS delivery"
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      const callbackUrl = `${window.location.origin}${giftCardSuccessPath()}`

      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderPhone,
          recipientName,
          recipientEmail: recipientEmail || undefined,
          recipientPhone: recipientPhone || undefined,
          message: message || undefined,
          deliveryMethod,
          amount: effectiveAmount,
          callbackUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create gift card")
        setIsSubmitting(false)
        return
      }

      window.location.href = data.data.authorizationUrl
    } catch {
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  const displayAmount = effectiveAmount && effectiveAmount > 0 ? effectiveAmount.toFixed(2) : "0.00"

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-fuchsia-50 mb-2">
          <Gift className="w-7 h-7 text-fuchsia-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Send a Gift Card</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Choose an amount and send it to someone special. They can spend it on any
          service — in full or in part — by booking online or visiting us.
        </p>
      </div>

      <div className="space-y-6">
        {/* Amount selection */}
        <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-fuchsia-600" />
            Gift amount
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PRESET_AMOUNTS.map((value) => {
              const active = customAmount.trim() === "" && amount === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePreset(value)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  GHS {value}
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Or enter a custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">GHS</span>
              <Input
                type="number"
                inputMode="decimal"
                min={MIN_GIFT_CARD_AMOUNT}
                max={MAX_GIFT_CARD_AMOUNT}
                placeholder="e.g. 250"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setAmount(null)
                  setError(null)
                }}
                className="pl-12"
              />
            </div>
            <p className="text-xs text-gray-400">
              Minimum GHS {MIN_GIFT_CARD_AMOUNT}.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Gift value</span>
            <span className="font-bold text-fuchsia-600 text-lg">GHS {displayAmount}</span>
          </div>
        </div>

        {/* Sender details */}
        <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="font-semibold text-gray-900">Your details</p>
          <Input placeholder="Your full name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          <Input placeholder="Your email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
          <Input placeholder="Your phone number" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
        </div>

        {/* Recipient details */}
        <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
          <p className="font-semibold text-gray-900">Recipient details</p>
          <Input placeholder="Recipient's full name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          <Input placeholder="Recipient's email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          <Input placeholder="Recipient's phone number" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
          <Textarea
            placeholder="Add a personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />

          {/* Delivery method */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Send via</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "EMAIL", label: "Email", icon: Mail },
                { value: "SMS", label: "SMS", icon: MessageSquare },
                { value: "BOTH", label: "Both", icon: Sparkles },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDeliveryMethod(value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                    deliveryMethod === value
                      ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment note — card payments are not accepted for gift cards */}
        <p className="text-xs text-gray-400 text-center">
          Gift cards are paid for with mobile money only.
        </p>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-6 text-base font-semibold rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay GHS {displayAmount} &amp; Send Gift</>
          )}
        </Button>
      </div>
    </div>
  )
}
