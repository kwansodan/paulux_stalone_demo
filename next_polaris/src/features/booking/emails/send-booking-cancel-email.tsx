import EmailBookingCancelled from "@/emails/booking/booking-cancelled-email";
import { resend } from "@/lib/resend";


export const sendBookingCancelEmail = async (
  email: string,
  bookingSummaryLink: string
) => {
  return await resend.emails.send({
    from: "no-reply@polarisbeauty.biz",
    to: email,
    subject: "Your Polaris Booking Has Been Cancelled",
    react: <EmailBookingCancelled url={bookingSummaryLink} />,
  });
}