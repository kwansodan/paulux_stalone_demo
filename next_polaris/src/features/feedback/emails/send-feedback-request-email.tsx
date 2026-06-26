import FeedbackRequestEmail from "@/emails/booking/feedback-request-email"
import { resend } from "@/lib/resend"

export const sendFeedbackRequestEmail = async (
  email: string,
  clientName: string,
  serviceNames: string,
  reviewLink: string | null,
) => {
  return await resend.emails.send({
    from: "no-reply@polarisbeautylounge.com",
    to: email,
    subject: "How was your visit to Polaris Beauty Lounge?",
    react: (
      <FeedbackRequestEmail
        clientName={clientName}
        serviceNames={serviceNames}
        reviewLink={reviewLink}
      />
    ),
  })
}
