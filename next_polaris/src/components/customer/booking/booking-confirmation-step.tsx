"use client"

import { Button } from "@/components/ui/button"
import { Scissors, Calendar, Clock, Loader2 } from "lucide-react"
import { useState } from "react"
import { BookingFormData } from "./customer-booking-form"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import { useCreateBooking } from "@/features/booking/client/hooks/use-booking"
import { BookingInput } from "@/features/booking/utils/validation"
import { isAxiosError } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { customerBookingSummaryPath } from "@/app/paths"

type Props = {
  formData: BookingFormData
  onBack: () => void
}

export default function BookingConfirmationStep({ formData, onBack }: Props) {
  const router = useRouter()
  const services = formData.selectedServices
  const [isProcessing, setIsProcessing] = useState(false)

  const hasDepositRequirement = services.some(s => s.minDepositPercent < 100)

  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">(
    (formData.minDepositPercent !== undefined ? formData.minDepositPercent < 100 : hasDepositRequirement) ? "deposit" : "full"
  )

  const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0)
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0)
  const depositAmount = formData.minDepositPercent !== undefined
    ? totalPrice * (formData.minDepositPercent / 100)
    : services.reduce((sum, s) => sum + (Number(s.price) * (s.minDepositPercent / 100)), 0)

  const createBookingMutation = useCreateBooking()

  const handleProceedToPayment = async () => {
    try {
      setIsProcessing(true)
      const amount = paymentOption === "deposit" ? depositAmount : totalPrice

      console.log("Proceeding to payment with:", {
        ...formData,
        paymentOption,
        amount,
      })

      // Step 1: Create the booking
      const payload: any = {
        serviceIds: formData.serviceIds,
        bookingTime: formData.time!,
        bookingDate: formData.date!,
        clientName: formData.fullName,
        clientEmail: formData.email,
        clientPhone: formData.phone,
      }

      const booking = await createBookingMutation.mutateAsync(payload)
      console.log("Booking created:", booking.id)

      // Step 2: Initialize unified payment
      // Include a flag so the summary page knows we came directly from payment
      const callbackUrl = `${window.location.origin}/customer/booking/summary/${booking.id}?from=payment`

      const paymentResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          amount: amount,
          bookingReference: booking.bookingReference,
          bookingId: booking.id,
          transactionType: 'initial',
          callbackUrl,
          phone: formData.phone,
        }),
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.message || 'Failed to initialize payment')
      }

      const paymentData = await paymentResponse.json()
      console.log("Payment initialized:", paymentData.invoiceNumber)

      // Note: The unified API creates the payment record (via generic invoicing and callbacks), 
      // but if we need a direct redirect, the unified API returns paymentData.paymentUrl

      // Step 3: Redirect to payment page
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl
      } else {
        throw new Error("Missing payment URL from gateway.")
      }

    } catch (error) {
      console.error("Error proceeding to payment:", error)
      setIsProcessing(false) // Stop processing on error
    }
  }


  return (
    <div className="space-y-6 relative">
      {isProcessing && (
        <div className="absolute inset-x-0 -top-4 -bottom-4 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
          <Loader2 className="w-10 h-10 animate-spin text-fuchsia-600 mb-4" />
          <p className="text-sm font-medium text-gray-700">Redirecting to payment gateway...</p>
        </div>
      )}
      <div className="space-y-6 p-4 rounded-3xl shadow-sm">
        {/* Booking Summary */}
        <div className="bg-pink-50 rounded-2xl p-3 space-y-6">
          <h3 className="text-[16px] font-semibold">Booking summary</h3>

          <div className="space-y-3">
            {/* Services */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Scissors className="w-4 h-4" />
                <span>Service choice</span>
              </div>
              <div className="pl-6 space-y-1">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-xs text-gray-400">GHS {Number(s.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Appointment</span>
              </div>
              <div className="text-right flex gap-1">
                <div className="text-sm font-medium">
                  {formatDate(formData.date || '', { weekday: 'short', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-sm font-medium">{formatTime(formData.time || '')}</div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between border-t border-pink-100 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Total Duration</span>
              </div>
              <span className="text-sm font-medium">
                {totalDuration} mins
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose payment option</h3>

          <div className={`flex flex-col gap-2 border-fuchsia-600 bg-pink-50 w-full p-5 rounded-2xl border-2 transition-colors`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Total Service Cost</span>
            </div>
            <span className="text-xl font-bold text-fuchsia-600">
              GHS {totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Pay Deposit */}
          {(formData.minDepositPercent !== undefined ? formData.minDepositPercent < 100 : hasDepositRequirement) && (
            <button
              onClick={() => setPaymentOption("deposit")}
              className={`
            w-full p-5 rounded-2xl border-2 text-left transition-colors
            ${paymentOption === "deposit"
                  ? "border-fuchsia-600 bg-pink-50"
                  : "border-gray-200 bg-white"
                }
          `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
              ${paymentOption === "deposit"
                      ? "border-fuchsia-600"
                      : "border-gray-300"
                    }
            `}
                >
                  {paymentOption === "deposit" && (
                    <div className="w-3 h-3 rounded-full bg-fuchsia-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Pay Deposit</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Secure your booking now, pay the remaining GHS{" "}
                    {depositAmount.toFixed(2)} at the salon
                  </p>
                  <span className="text-xl font-bold text-fuchsia-600">
                    GHS {depositAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </button>
          )}

          {/* Pay in Full */}
          <button
            onClick={() => setPaymentOption("full")}
            className={`
            w-full p-5 rounded-2xl border-2 text-left transition-colors
            ${paymentOption === "full"
                ? "border-fuchsia-600 bg-pink-50"
                : "border-gray-200 bg-white"
              }
          `}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
              ${paymentOption === "full"
                    ? "border-fuchsia-600"
                    : "border-gray-300"
                  }
            `}
              >
                {paymentOption === "full" && (
                  <div className="w-3 h-3 rounded-full bg-fuchsia-600" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Pay in full</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  Complete payment now and skip checkout at the salon
                </p>
                <span className="text-xl font-bold text-fuchsia-600">
                  GHS {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </button>

          {/* Payment info */}
          <p className="text-xs text-gray-500 text-center">
            Secure payment powered by Paystack. Your card details are encrypted.
          </p>
        </div>
      </div>

      {createBookingMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-600">
            {isAxiosError(createBookingMutation.error)
              ? (createBookingMutation.error as any).response?.data?.message || (createBookingMutation.error as any).message
              : "Failed to create booking. Please try again"}
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-14 rounded-full text-base font-medium border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={handleProceedToPayment}
          disabled={createBookingMutation.isPending || isProcessing}
          className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
        >
          {createBookingMutation.isPending || isProcessing ? "Processing..." : "Proceed to payment"}
        </Button>
      </div>
    </div>
  )
}