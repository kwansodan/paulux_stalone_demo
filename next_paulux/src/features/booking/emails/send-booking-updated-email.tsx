import BookingUpdatedEmail from "@/emails/booking/booking-updated-email"
import { resend } from "@/lib/resend"

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
    from: "no-reply@pauluxbooking.com",
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
