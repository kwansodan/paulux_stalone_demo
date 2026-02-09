import BookingSummary from "@/components/customer/booking/customer-booking-summary";
import StepIndicator from "@/components/customer/booking/step-indicator";
import { BOOKING_STEPS } from "@/constants";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { BookingWithServiceAndPayment } from "@/features/booking/types";


export default async function BookingSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const awaitedParams = await params;
  const bookingId = awaitedParams.id;
  const booking = await bookingRepository.findById(bookingId)

  return (
    <div className="space-y-12 px-5 py-8 bg-gray-50">
      {/* Step Indicator */}
      <StepIndicator steps={BOOKING_STEPS} currentStep={4} />

      <BookingSummary booking={booking} />
    </div>
  )
}
