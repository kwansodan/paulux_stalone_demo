import { inngest } from "@/lib/inngest"
import { customerBookingSummaryPath } from "@/app/paths";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { getBaseUrl } from "@/utils/url";
import { sendSMS } from "@/lib/arkesal";
import { formatDate, formatTime } from "@/features/booking/utils/helpers";

export const bookingCreatedEvent = inngest.createFunction(
  { id: "booking-created" },
  { event: "app/booking.booking-created" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    console.log("BOOKING CREATED EVENT RECEIVED FOR", bookingId)

    const booking = await step.run("fetch-booking", async () => {
      const b = await bookingRepository.findById(bookingId);
      if (!b) throw new Error(`Booking ${bookingId} not found`);
      return b;
    });

    const bookingSummaryLink = getBaseUrl() + customerBookingSummaryPath(bookingId)
    const serviceNames = booking.services.map(s => s.service.name).join(", ");
    const dateFormatted = formatDate(booking.bookingDate);
    const timeFormatted = formatTime(booking.bookingTime);

    let smsResult = null;
    if (booking.clientPhone) {
      smsResult = await step.run("send-booking-confirmation-sms", async () => {
        const message = `Hi ${booking.clientName}, your appointment for ${serviceNames} on ${dateFormatted} at ${timeFormatted} has been booked. Ref: ${booking.bookingReference}. Details: ${bookingSummaryLink}`;

        const result = await sendSMS({
          recipients: [booking.clientPhone],
          message
        });

        if (!result?.success) {
          console.error("Failed to send booking confirmation SMS:", result);
        }
        return result;
      });
    }

    return {
      bookingId,
      smsStatus: smsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone")
    }
  }
)
