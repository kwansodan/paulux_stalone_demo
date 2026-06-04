import CustomerReceiptEmail from "@/emails/booking/customer-receipt-email"
import { resend } from "@/lib/resend"

export const sendCustomerReceiptEmail = async (
  customerEmail: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string[],
  paymentDate: string,
  amountPaid: number,
  paymentMethod: string,
  remainingBalance: number,
) => {
  return await resend.emails.send({
    from: "no-reply@polarisbeautylounge.com",
    to: customerEmail,
    subject: `Payment Confirmation – ${bookingReference}`,
    react: (
      <CustomerReceiptEmail
        clientName={clientName}
        bookingReference={bookingReference}
        serviceNames={serviceNames}
        paymentDate={paymentDate}
        amountPaid={amountPaid}
        paymentMethod={paymentMethod}
        remainingBalance={remainingBalance}
      />
    ),
  })
}
