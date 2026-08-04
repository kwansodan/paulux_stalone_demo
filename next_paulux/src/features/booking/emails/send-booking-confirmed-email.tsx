import BookingConfirmedEmail from "@/emails/booking/booking-confirmed-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

export const sendBookingConfirmedEmail = async (
  email: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string,
  bookingDate: string,
  bookingTime: string,
  bookingSummaryUrl: string,
  productNames?: string,
) => {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Booking Request Received – ${bookingReference}`,
    react: (
      <BookingConfirmedEmail
        clientName={clientName}
        bookingReference={bookingReference}
        serviceNames={serviceNames}
        productNames={productNames}
        bookingDate={bookingDate}
        bookingTime={bookingTime}
        bookingSummaryUrl={bookingSummaryUrl}
      />
    ),
  })
}
