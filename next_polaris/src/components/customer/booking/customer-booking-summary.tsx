"use client"

import { Button } from "@/components/ui/button"
import { Upload, User, Hash, Mail, Phone, Clock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import html2canvas from "html2canvas"
import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { useCancelBooking } from "@/features/booking/client/hooks/use-booking"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import Modal from "@/components/modal"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"
import { PolicyBottomSheet } from "@/components/policy-bottom-sheet"

type Props = {
  booking: any
}

export default function BookingSummary({ booking }: Props) {
  const router = useRouter()
  const summaryRef = useRef<HTMLDivElement>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const { mutate: cancelBooking, isPending } = useCancelBooking()
  // New state for verification
  const [isVerifying, setIsVerifying] = useState(false);
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const fromPayment = searchParams.get('from') === 'payment';

  const price = booking.service ? Number(booking.service.price) : 0
  const depositAmount = price * ((booking.minDepositPercent || booking.service!.minDepositPercent || 0) / 100)
  const bookingPaymentStatus = calculatePaymentStatus(booking)
  // Verify payment on mount if reference exists and status is pending
  useEffect(() => {
    if (reference && bookingPaymentStatus === 'PENDING' && !isVerifying) {
      const verifyPayment = async () => {
        setIsVerifying(true);
        try {
          // Call our verification endpoint
          // We use fetch directly here for simplicity, or could use a custom hook
          const response = await fetch(`/api/paystack/verify/${reference}`);
          const data = await response.json();

          if (response.ok && data.success) {
            toast.success("Payment verified successfully!");
            // Refresh the page to show updated status
            router.refresh();
          } else {
            // Only show error if it's a genuine failure, not just "still pending"
            // But verify endpoint usually returns success=false if not paid
            console.warn("Verification returned unsuccessful", data);
          }
        } catch (error) {
          console.error("Verification failed", error);
        } finally {
          setIsVerifying(false);
        }
      };
      verifyPayment();
    }
  }, [reference, bookingPaymentStatus, router, isVerifying]);

  const handleShare = async () => {
    if (!summaryRef.current) return

    try {
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], "booking-summary.png", { type: "image/png" })

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Booking Summary",
            text: `Booking ${booking.bookingReference}`,
          })
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `booking-${booking.bookingReference}.png`
          link.click()
          URL.revokeObjectURL(url)
          toast.success("Booking summary downloaded")
        }
      })
    } catch (error) {
      console.error("Failed to share:", error)
      toast.error("Failed to share booking summary")
    }
  }

  const handleCancelBooking = () => {
    if (!booking.id) return

    setIsCancelModalOpen(true)

  }

  const handleCancelSubmit = () => {
    cancelBooking(booking.id, {
      onSuccess: () => {
        toast.success("Booking cancelled successfully")
        router.refresh()
        setIsCancelModalOpen(false)
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700 border-green-700"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-700"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-700"
      default:
        return "bg-gray-100 text-gray-700 border-gray-700"
    }
  }

  const getPaymentStatusText = () => {
    const payment = booking.payments?.[0]
    if (!payment) return "Not paid"

    if (payment.status === "PAID") {
      return payment.amount === booking.service?.price ? "Paid in full" : "Deposit paid"
    }
    if (payment.status === "REFUNDED") {
      return "Refunded"
    }
    return payment.status
  }

  const hasRefundablePayment = () => {
    return booking.payments?.some((p: any) => p.status === "PAID" && p.provider === "PAYSTACK")
  }

  return (
    <>
      {/* Summary Card */}
      <div ref={summaryRef} className="mt-12 bg-white rounded-3xl p-6 space-y-6">
        <div className="bg-pink-50  space-y-6 rounded-2xl px-3 py-6">

          {/* Header */}
          <div className="border-b  py-3 flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{booking.service?.name}</h1>
              <div className="text-right flex gap-1 items-center justify-start">
                <div className="text-sm font-medium">
                  {formatDate(booking.bookingDate || '', { weekday: 'short', month: 'short', year: 'numeric' })}
                </div>
                <div className="bg-black w-1 h-1 rounded-full" />
                <div className="text-sm font-medium">{formatTime(booking.bookingTime || '')}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full bg-fuchsia-100"
            >
              <Upload className="h-5 w-5" />
            </Button>
          </div>


          {/* Date & Time */}
          <p className="text-sm text-gray-600">
            {formatDate(booking.bookingDate)} • {booking.bookingTime}
          </p>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Client */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="text-sm">Client</span>
              </div>
              <span className="text-sm font-medium">{booking.clientName}</span>
            </div>

            {/* Booking Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Booking number</span>
              </div>
              <span className="text-sm font-medium">{booking.bookingReference}</span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </div>
              <span className="text-sm font-medium break-all">{booking.clientEmail}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Phone number</span>
              </div>
              <span className="text-sm font-medium">{booking.clientPhone}</span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10.5H2C1.73487 10.4997 1.48068 10.3943 1.2932 10.2068C1.10572 10.0193 1.00028 9.76513 1 9.5V6.5C1.00028 6.23487 1.10572 5.98068 1.2932 5.7932C1.48068 5.60572 1.73487 5.50028 2 5.5H14C14.2651 5.50028 14.5193 5.60572 14.7068 5.7932C14.8943 5.98068 14.9997 6.23487 15 6.5V9.5C14.9997 9.76513 14.8943 10.0193 14.7068 10.2068C14.5193 10.3943 14.2651 10.4997 14 10.5ZM2 6.5V9.5H14V6.5H2Z" fill="#475568" />
                  <path d="M10 7.5H3V8.5H10V7.5Z" fill="#475568" />
                </svg>

                <span className="text-sm">Status</span>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                  booking.status
                )}`}
              >
                {getPaymentStatusText()}
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Duration</span>
              </div>
              <span className="text-sm font-medium">
                {booking.service?.durationMinutes} mins
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 11H1V12H15V11Z" fill="#475568" />
                  <path d="M15 13H1V14H15V13Z" fill="#475568" />
                  <path d="M12 5C11.8022 5 11.6089 5.05865 11.4444 5.16853C11.28 5.27841 11.1518 5.43459 11.0761 5.61732C11.0004 5.80004 10.9806 6.00111 11.0192 6.19509C11.0578 6.38907 11.153 6.56725 11.2929 6.70711C11.4327 6.84696 11.6109 6.9422 11.8049 6.98079C11.9989 7.01937 12.2 6.99957 12.3827 6.92388C12.5654 6.84819 12.7216 6.72002 12.8315 6.55557C12.9414 6.39112 13 6.19778 13 6C13 5.73478 12.8946 5.48043 12.7071 5.29289C12.5196 5.10536 12.2652 5 12 5Z" fill="#475568" />
                  <path d="M8 8C7.60444 8 7.21776 7.8827 6.88886 7.66294C6.55996 7.44318 6.30362 7.13082 6.15224 6.76537C6.00087 6.39991 5.96126 5.99778 6.03843 5.60982C6.1156 5.22186 6.30608 4.86549 6.58579 4.58579C6.86549 4.30608 7.22186 4.1156 7.60982 4.03843C7.99778 3.96126 8.39991 4.00087 8.76537 4.15224C9.13082 4.30362 9.44318 4.55996 9.66294 4.88886C9.8827 5.21776 10 5.60444 10 6C9.9994 6.53025 9.7885 7.03861 9.41356 7.41356C9.03861 7.7885 8.53025 7.9994 8 8ZM8 5C7.80222 5 7.60888 5.05865 7.44443 5.16853C7.27998 5.27841 7.15181 5.43459 7.07612 5.61732C7.00043 5.80004 6.98063 6.00111 7.01921 6.19509C7.0578 6.38907 7.15304 6.56725 7.29289 6.70711C7.43275 6.84696 7.61093 6.9422 7.80491 6.98079C7.99889 7.01937 8.19996 6.99957 8.38268 6.92388C8.56541 6.84819 8.72159 6.72002 8.83147 6.55557C8.94135 6.39112 9 6.19778 9 6C8.99974 5.73486 8.89429 5.48066 8.70681 5.29319C8.51934 5.10571 8.26514 5.00026 8 5Z" fill="#475568" />
                  <path d="M4 5C3.80222 5 3.60888 5.05865 3.44443 5.16853C3.27998 5.27841 3.15181 5.43459 3.07612 5.61732C3.00043 5.80004 2.98063 6.00111 3.01921 6.19509C3.0578 6.38907 3.15304 6.56725 3.29289 6.70711C3.43275 6.84696 3.61093 6.9422 3.80491 6.98079C3.99889 7.01937 4.19996 6.99957 4.38268 6.92388C4.56541 6.84819 4.72159 6.72002 4.83147 6.55557C4.94135 6.39112 5 6.19778 5 6C5 5.73478 4.89464 5.48043 4.70711 5.29289C4.51957 5.10536 4.26522 5 4 5Z" fill="#475568" />
                  <path d="M14 10H2C1.73499 9.99933 1.48103 9.89375 1.29364 9.70636C1.10625 9.51897 1.00067 9.26501 1 9V3C1.00067 2.73499 1.10625 2.48103 1.29364 2.29364C1.48103 2.10625 1.73499 2.00067 2 2H14C14.265 2.00067 14.519 2.10625 14.7064 2.29364C14.8938 2.48103 14.9993 2.73499 15 3V9C14.9996 9.26511 14.8942 9.51925 14.7067 9.70671C14.5193 9.89417 14.2651 9.99964 14 10ZM14 3H2V9H14V3Z" fill="#475568" />
                </svg>

                <span className="text-sm">Price</span>
              </div>
              <span className="text-sm font-medium">
                GHS {Number(depositAmount).toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Manage booking + policies (hidden when coming directly from payment redirect) */}
      {!fromPayment && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-pink-50 px-5 py-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage booking</h2>
              <div className="mt-3 border-t border-fuchsia-100" />
            </div>

            {booking.status !== "CANCELLED" && (
              <Button
                className="w-full h-12 rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-medium flex items-center justify-center gap-2"
                onClick={() => router.push(`/customer/booking/reschedule/${booking.id}`)}
                disabled={isPending}
              >
                <Clock className="h-4 w-4" />
                Reschedule booking
              </Button>
            )}

            {booking.status !== "CANCELLED" && (
              <Button
                variant="outline"
                onClick={handleCancelBooking}
                disabled={isPending}
                className="w-full h-12 rounded-full border-red-500 text-red-600 hover:bg-red-50 text-sm font-medium"
              >
                {isPending ? "Cancelling..." : "Cancel booking"}
              </Button>
            )}

            <p className="text-xs text-gray-600">
              <span className="font-medium">Cancellation policy:</span> Free cancellation up to 24
              hours before your appointment. Late cancellations may be subject to fees.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <PolicyBottomSheet triggerLabel="Privacy Policy" title="Privacy Policy">
              <p className="mb-4 text-sm">
                Polaris, we respect your privacy and committed to protecting your personal information.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Information We Collect</h3>
                  <p className="text-sm mb-2">When you book an appointment, we collect:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Selected service and appointment details</li>
                    <li>Payment confirmation reference (via Paystack)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    We do not store your card details. Payments are securely processed by Paystack.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. How We Use Your Information</h3>
                  <p className="text-sm mb-2">We use your information to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Process and manage your bookings</li>
                    <li>Send booking confirmations and updates</li>
                    <li>Communicate appointment reminders or changes</li>
                    <li>Improve our services and customer experience</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Payment Security</h3>
                  <p className="text-sm">
                    All payments are securely processed by Paystack. We do not store debit/credit card details on our servers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. Data Storage & Protection</h3>
                  <p className="text-sm">
                    Your booking information is stored securely using encrypted database systems. Access is restricted to authorized staff only.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5. Data Sharing</h3>
                  <p className="text-sm mb-2">We do not sell, rent, or trade your personal information.</p>
                  <p className="text-sm mb-2">We may share limited information with:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Payment processors (Paystack)</li>
                    <li>Email delivery providers (for booking confirmations)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6. Your Rights</h3>
                  <p className="text-sm mb-2">You may request to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>View your stored information</li>
                    <li>Correct inaccurate details</li>
                    <li>Request deletion of your booking data (where legally permitted)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">7. Contact Us</h3>
                  <p className="text-sm">
                    If you have any privacy-related concerns, please contact us at:<br />
                    <strong>help@polaris.com</strong><br />
                    <strong>+233 55 623 3900</strong>
                  </p>
                </div>
              </div>
            </PolicyBottomSheet>


            <span>•</span>

            <PolicyBottomSheet triggerLabel="Terms of Service" title="Terms of Service">
              <p className="mb-4 text-sm">
                By using our booking system, you agree to the following terms:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Booking Policy</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>All appointments must be booked at least 24 hours in advance.</li>
                    <li>A valid name, email, and phone number are required.</li>
                    <li>Payment is required before admin approval.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Appointment Confirmation</h3>
                  <p className="text-sm">
                    After payment, your booking will be marked as pending until approved by salon staff. You will receive a confirmation email once approved.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Cancellations</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Cancellations are allowed up to 24 hours before your appointment.</li>
                    <li>Late cancellations (within 24 hours) may not be eligible for refunds.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. No-Show Policy</h3>
                  <p className="text-sm">
                    Failure to attend your appointment without prior cancellation may result in forfeiture of payment.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5. Pricing</h3>
                  <p className="text-sm">
                    All prices are displayed in Ghana Cedis (GHS) and are subject to change without prior notice. Price changes do not affect confirmed bookings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6. Service Refusal</h3>
                  <p className="text-sm">
                    We reserve the right to refuse service in cases of inappropriate behavior, safety concerns, or violation of salon policies.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">7. Modifications</h3>
                  <p className="text-sm">
                    We may update these terms at any time. Continued use of the booking system indicates acceptance of any updates.
                  </p>
                </div>
              </div>
            </PolicyBottomSheet>


            <span>•</span>

            <PolicyBottomSheet triggerLabel="Refund Policy" title="About our Refund Policy and Enforcement">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Eligible Refunds</h3>
                  <p className="text-sm mb-2">Refunds may be considered if:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>The salon cancels your confirmed appointment.</li>
                    <li>A booking is rejected after payment.</li>
                    <li>A technical error results in duplicate charges.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Non-Refundable Situations</h3>
                  <p className="text-sm mb-2">Refunds will generally not be issued if:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>You cancel within 24 hours of your appointment.</li>
                    <li>You fail to attend your appointment (no-show).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Refund Process</h3>
                  <p className="text-sm mb-2">
                    Refunds are processed manually and may take 5-10 business days depending on your payment provider.
                  </p>
                  <p className="text-sm mb-2">
                    To request a refund, please contact:
                  </p>
                  <p className="text-sm font-medium mb-2">
                    [Salon Email Address]
                  </p>
                  <p className="text-sm">
                    Include your booking reference (BK-XXXXXX).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Payment Processing Fees</h3>
                  <p className="text-sm">
                    Certain payment processing fees may be non-refundable.
                  </p>
                </div>
              </div>
            </PolicyBottomSheet>

          </div>
        </div>
      )}

      <Modal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Booking?"
        subtitle={
          hasRefundablePayment()
            ? "Your payment will be refunded. This may take up to 10 business days."
            : "Are you sure you want to cancel this booking?"
        }
        childrenClassName="max-h-[224px] "
        showSeparator={false}
      >
        {hasRefundablePayment() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Refund Information:</strong>
              <br />
              A full refund will be automatically initiated to your original payment method. Please
              allow up to 10 business days for the refund to appear in your account.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            className="bg-[#D10505] hover:bg-[#D10505]/90"
            type="button"
            onClick={() => setIsCancelModalOpen(false)}
          >
            Close
          </Button>
          <Button variant="outline" onClick={() => handleCancelSubmit()} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </div>
      </Modal>
    </>
  )
}