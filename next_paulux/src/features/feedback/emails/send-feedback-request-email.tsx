import FeedbackRequestEmail from "@/emails/booking/feedback-request-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

export const sendFeedbackRequestEmail = async (
  email: string,
  clientName: string,
  serviceNames: string,
  reviewLink: string | null,
) => {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "How was your visit to Paulux Booking?",
    react: (
      <FeedbackRequestEmail
        clientName={clientName}
        serviceNames={serviceNames}
        reviewLink={reviewLink}
      />
    ),
  })
}
