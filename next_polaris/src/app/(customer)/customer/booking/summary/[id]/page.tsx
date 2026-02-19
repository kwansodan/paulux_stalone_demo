import BookingSummary from "@/components/customer/booking/customer-booking-summary";
import StepIndicator from "@/components/customer/booking/step-indicator";
import { BOOKING_STEPS } from "@/constants";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { BookingWithServiceAndPayment } from "@/features/booking/types";

export const dynamic = 'force-dynamic'

export default async function BookingSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reference?: string }>
}) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const bookingId = awaitedParams.id;
  const reference = awaitedSearchParams.reference;

  const booking = await bookingRepository.findById(bookingId)

  // Check if this is a callback from Paystack
  const isPaymentCallback = !!reference;
  const paymentStatus = booking?.paymentStatus;

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-4 text-center">
        <div className="bg-red-50 p-4 rounded-full">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Booking Not Found</h1>
        <p className="text-gray-500 max-w-sm">
          We couldn't find the booking you're looking for. It may have been cancelled or the link is invalid.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12 px-5 py-8 bg-gray-50">
      {/* Step Indicator */}
      <StepIndicator steps={BOOKING_STEPS} currentStep={4} />

      {/* Payment Status Message */}
      {isPaymentCallback && (
        <div className={`rounded-2xl p-4 ${paymentStatus === 'PAID'
          ? 'bg-green-50 border-2 border-green-200'
          : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
          <h3 className={`font-semibold mb-2 ${paymentStatus === 'PAID' ? 'text-green-800' : 'text-yellow-800'
            }`}>
            {paymentStatus === 'PAID' ? '✓ Payment Successful!' : '⏳ Payment Processing'}
          </h3>
          <p className={`text-sm ${paymentStatus === 'PAID' ? 'text-green-700' : 'text-yellow-700'
            }`}>
            {paymentStatus === 'PAID'
              ? 'Your payment has been confirmed and your booking is now confirmed. You will receive a confirmation email shortly.'
              : 'Your payment is being processed. This may take a few moments. Please refresh the page if the status doesn\'t update automatically.'}
          </p>
        </div>
      )}

      <BookingSummary booking={booking} />
    </div>
  )
}
