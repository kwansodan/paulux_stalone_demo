import CustomerReceiptEmail from "@/emails/booking/customer-receipt-email"
import { resend } from "@/lib/resend"

export const sendCustomerReceiptEmail = async (
  customerEmail: string,
  clientName: string,
  bookingReference: string,
  serviceNames: string,
  bookingDate: string,
  bookingTime: string,
  amountPaid: number,
  totalAmount: number,
  totalPaid: number,
  bookingId: string,
) => {
  return await resend.emails.send({
    from: "no-reply@polarisbeautylounge.com",
    to: customerEmail,
    subject: `Payment Receipt – ${bookingReference}`,
    react: (
      <CustomerReceiptEmail
        clientName={clientName}
        bookingReference={bookingReference}
        serviceNames={serviceNames}
        bookingDate={bookingDate}
        bookingTime={bookingTime}
        amountPaid={amountPaid}
        totalAmount={totalAmount}
        totalPaid={totalPaid}
        bookingId={bookingId}
      />
    ),
  })
}
