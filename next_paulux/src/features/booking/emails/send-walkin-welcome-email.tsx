import WalkinWelcomeEmail from "@/emails/booking/walkin-welcome-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

export const sendWalkinWelcomeEmail = async (
  email: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string[],
  bookingSummaryUrl: string,
  productNames?: string[],
) => {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Welcome to Paulux! 🌟 – ${bookingReference}`,
    react: (
      <WalkinWelcomeEmail
        clientName={clientName}
        bookingReference={bookingReference}
        serviceNames={serviceNames}
        productNames={productNames}
        bookingSummaryUrl={bookingSummaryUrl}
      />
    ),
  })
}
