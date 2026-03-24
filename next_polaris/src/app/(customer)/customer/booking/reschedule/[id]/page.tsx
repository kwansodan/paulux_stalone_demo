import CustomerRescheduleBooking from "@/components/customer/booking/customer-reschedule-booking"
import { bookingRepository } from "@/features/booking/server/booking.repository"

export const dynamic = "force-dynamic"

export default async function CustomerRescheduleBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const awaitedParams = await params
  const bookingId = awaitedParams.id

  const booking = await bookingRepository.findById(bookingId)

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
          We couldn&apos;t find the booking you&apos;re trying to reschedule. It may have been cancelled or
          the link is invalid.
        </p>
      </div>
    )
  }

  const serializedBooking = {
    ...booking,
    payments: booking.payments.map((p) => ({
      ...p,
      amount: p.amount.toString()
    })),
    services: booking.services.map((bs) => ({
      ...bs,
      priceAtBooking: bs.priceAtBooking.toString(),
      service: {
        ...bs.service,
        price: bs.service.price.toString()
      }
    }))
  }

  return (
    <div className="space-y-8 px-5 py-8 bg-gray-50">
      <CustomerRescheduleBooking booking={serializedBooking} />
    </div>
  )
}

