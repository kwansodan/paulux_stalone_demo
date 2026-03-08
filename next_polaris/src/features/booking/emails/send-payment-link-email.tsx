import PaymentLinkEmail from "@/emails/booking/payment-link-email";
import { resend } from "@/lib/resend";

export const sendPaymentLinkEmail = async (
    email: string,
    customerName: string,
    serviceName: string,
    amount: number,
    paymentUrl: string,
    bookingDate: string,
    bookingTime: string
) => {
    return await resend.emails.send({
        from: "no-reply@app.polarisbeauty.biz",
        to: email,
        subject: `Payment Link for your ${serviceName} Booking`,
        react: <PaymentLinkEmail
            customerName={customerName}
            serviceName={serviceName}
            amount={amount}
            paymentUrl={paymentUrl}
            bookingDate={bookingDate}
            bookingTime={bookingTime}
        />,
    });
}
