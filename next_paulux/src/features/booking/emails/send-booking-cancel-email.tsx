import EmailBookingCancelled from "@/emails/booking/booking-cancelled-email"
import { resend } from "@/lib/resend"

export const sendBookingCancelEmail = async (
  email: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string,
  bookingDate: string,
  bookingTime: string,
  bookingSummaryLink: string,
) => {
  return await resend.emails.send({
    from: "no-reply@pauluxbooking.com",
    to: email,
    subject: `Your Booking Has Been Cancelled – ${bookingReference}`,
    react: (
      <EmailBookingCancelled
        clientName={clientName}
        bookingReference={bookingReference}
        serviceNames={serviceNames}
        bookingDate={bookingDate}
        bookingTime={bookingTime}
        url={bookingSummaryLink}
      />
    ),
  })
}
