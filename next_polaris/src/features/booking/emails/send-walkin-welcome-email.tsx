import WalkinWelcomeEmail from "@/emails/booking/walkin-welcome-email"
import { resend } from "@/lib/resend"

export const sendWalkinWelcomeEmail = async (
  email: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string[],
  bookingSummaryUrl: string,
  productNames?: string[],
) => {
  return await resend.emails.send({
    from: "no-reply@polarisbeautylounge.com",
    to: email,
    subject: `Welcome to Polaris! 🌟 – ${bookingReference}`,
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
