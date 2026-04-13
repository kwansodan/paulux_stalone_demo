import { inngest } from "@/lib/inngest"
import { bookingRepository } from "@/features/booking/server/booking.repository";

export const bookingCreatedEvent = inngest.createFunction(
  { id: "booking-created" },
  { event: "app/booking.booking-created" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    console.log("BOOKING CREATED EVENT RECEIVED FOR", bookingId)

    // Customer notifications (SMS/email) are sent after payment succeeds
    // via the payment-received event, not here.

    return { bookingId }
  }
)
