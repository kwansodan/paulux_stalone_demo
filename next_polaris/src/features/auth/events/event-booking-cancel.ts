import { inngest } from "@/lib/inngest"
import { customerBookingSummaryPath } from "@/app/paths";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { getBaseUrl } from "@/utils/url";
import { sendBookingCancelEmail } from "@/features/booking/emails/send-booking-cancel-email";
import { sendSMS } from "@/lib/arkesal";
import { formatTime } from "@/features/booking/utils/helpers";

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

    if (booking?.clientPhone) {
      try {
        const timeFormatted = formatTime(booking.bookingTime);
        const dateFormatted = new Date(booking.bookingDate).toLocaleDateString()
        const message = `Hi ${booking.clientName}, your appointment for ${booking.service.name} on ${dateFormatted} at ${timeFormatted} has been cancelled. View details: ${bookingSummaryLink}`;

        const smsResult = await sendSMS({
          recipients: [booking.clientPhone],
          message
        });

        if (!smsResult?.success) {
          console.error("Failed to send cancellation SMS", smsResult);
        } else {
          console.log("Cancellation SMS sent successfully to", booking.clientPhone);
        }
      } catch (smsError) {
        console.error("Error in SMS sending block:", smsError);
      }
    }

    return {
      event,
      body: {
        email: result,
      }
    }

  }
)