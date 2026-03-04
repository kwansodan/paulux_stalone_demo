import { inngest } from "@/lib/inngest"
import { customerBookingSummaryPath } from "@/app/paths";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { getBaseUrl } from "@/utils/url";
import { sendBookingCancelEmail } from "@/features/booking/emails/send-booking-cancel-email";


export const bookingCancelledEvent = inngest.createFunction(
  { id: "booking-cancel" },
  { event: "app/booking.booking-cancel" },
  async ({ event }) => {

    const { bookingId } = event.data;

    console.log("CANCEL BOOKING EVENT RECEIVED FOR", bookingId)

    const booking = await bookingRepository.findById(bookingId);

    const bookingSummaryLink = getBaseUrl() + customerBookingSummaryPath(bookingId)

    if (!booking?.clientEmail) {
      throw new Error(`No client email for booking`)
    }

    const result = await sendBookingCancelEmail(booking?.clientEmail, bookingSummaryLink)

    if (result.error) {
      console.log("ERROR SENDING BOOKING CANCELLED EVENT", result)
      throw new Error(`${result.error.name}: ${result.error.message}`);
    }

    return {
      event,
      body: result
    }

  }
)