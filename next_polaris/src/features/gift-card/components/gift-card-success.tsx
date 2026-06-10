"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SerializedGiftCard } from "@/features/gift-card/types"
import { giftCardsPath } from "@/app/paths"
import { CheckCircle2, Clock, XCircle, Gift, Loader2 } from "lucide-react"

type VerifyState = "loading" | "success" | "pending" | "error"

export default function GiftCardSuccess() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [state, setState] = useState<VerifyState>("loading")
  const [giftCard, setGiftCard] = useState<SerializedGiftCard | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      setState("error")
      setErrorMessage("Missing payment reference")
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const res = await fetch(`/api/gift-cards/verify/${reference}`)
        const data = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
          setState("error")
          setErrorMessage(data.message || "Failed to verify payment")
          return
        }

        const card: SerializedGiftCard = data.data
        setGiftCard(card)

        if (card.status === "PENDING_PAYMENT") {
          setState("pending")
        } else {
          setState("success")
        }
      } catch {
        if (!cancelled) {
          setState("error")
          setErrorMessage("Something went wrong while verifying your payment")
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [reference])

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
      {state === "loading" && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fuchsia-50">
            <Loader2 className="w-8 h-8 text-fuchsia-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verifying your payment...</h1>
          <p className="text-gray-500">Please wait while we confirm your gift card payment.</p>
        </>
      )}

      {state === "success" && giftCard && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gift sent successfully! 🎁</h1>
          <p className="text-gray-500">
            Thank you, {giftCard.senderName}! Your gift worth GHS {Number(giftCard.totalAmount).toFixed(2)} for{" "}
            {giftCard.recipientName} is on its way.
          </p>
          <div className="rounded-2xl border border-gray-200 p-4 space-y-1 text-left">
            <p className="text-xs text-gray-500 font-medium">Gift Code</p>
            <p className="text-lg font-bold text-gray-900 tracking-wide flex items-center gap-2">
              <Gift className="w-4 h-4 text-fuchsia-600" />
              {giftCard.code}
            </p>
          </div>
          <Link href={giftCardsPath()}>
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl">
              Send another gift
            </Button>
          </Link>
        </>
      )}

      {state === "pending" && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment processing</h1>
          <p className="text-gray-500">
            Your payment is still being processed. This may take a few moments — please refresh this page shortly.
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500">{errorMessage || "We couldn't verify your gift card payment."}</p>
          <Link href={giftCardsPath()}>
            <Button variant="outline" className="rounded-xl">
              Back to gift cards
            </Button>
          </Link>
        </>
      )}
    </div>
  )
}
