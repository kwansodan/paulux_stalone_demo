import BookingConfirmedEmail from "@/emails/booking/booking-confirmed-email"
import { resend } from "@/lib/resend"

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
    from: "no-reply@polarisbeautylounge.com",
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
