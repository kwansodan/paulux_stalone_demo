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
  async ({ event, step }) => {
    const { bookingId } = event.data;

    console.log("CANCEL BOOKING EVENT RECEIVED FOR", bookingId)

    const booking = await step.run("fetch-booking", async () => {
      const b = await bookingRepository.findById(bookingId);
      if (!b) throw new Error(`Booking ${bookingId} not found`);
      return b;
    });

    const bookingSummaryLink = getBaseUrl() + customerBookingSummaryPath(bookingId)

    if (!booking.clientEmail) {
      throw new Error(`No client email for booking`)
    }

    const emailResult = await step.run("send-cancellation-email", async () => {
      const result = await sendBookingCancelEmail(booking.clientEmail, bookingSummaryLink)
      if (result.error) {
        throw new Error(`${result.error.name}: ${result.error.message}`);
      }
      return result;
    });

    let smsResult = null;
    if (booking.clientPhone) {
      smsResult = await step.run("send-cancellation-sms", async () => {
        const timeFormatted = formatTime(booking.bookingTime);
        const dateFormatted = new Date(booking.bookingDate).toLocaleDateString()
        const message = `Hi ${booking.clientName}, your appointment for ${booking.service.name} on ${dateFormatted} at ${timeFormatted} has been cancelled. View details: ${bookingSummaryLink}`;

        const result = await sendSMS({
          recipients: [booking.clientPhone],
          message
        });

        if (!result?.success) {
          throw new Error(`Failed to send SMS: ${JSON.stringify(result)}`);
        }
        return result;
      });
    }

    return {
      event,
      body: {
        email: emailResult,
        sms: smsResult
      }
    }
  }
)