import BookingUpdatedEmail from "@/emails/booking/booking-updated-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

export const sendBookingUpdatedEmail = async (
  email: string,
  clientName: string,
  bookingReference: string,
  changeSummary: string[],
  bookingDate: string,
  bookingTime: string,
  bookingSummaryUrl: string,
) => {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Booking Updated – ${bookingReference}`,
    react: (
      <BookingUpdatedEmail
        clientName={clientName}
        bookingReference={bookingReference}
        changeSummary={changeSummary}
        bookingDate={bookingDate}
        bookingTime={bookingTime}
        bookingSummaryUrl={bookingSummaryUrl}
      />
    ),
  })
}
