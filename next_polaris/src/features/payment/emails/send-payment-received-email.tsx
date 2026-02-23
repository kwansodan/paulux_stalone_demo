import PaymentReceivedEmail from "@/emails/booking/payment-received-email";
import { resend } from "@/lib/resend";

export const sendPaymentReceivedEmail = async (
    adminEmail: string,
    adminName: string,
    clientName: string,
    bookingReference: string,
    serviceName: string,
    bookingDate: string,
    bookingTime: string,
    amountPaid: number,
    provider: string,
    bookingId: string,
) => {
    return await resend.emails.send({
        from: "no-reply@app.ishmaelsroadstonextapp.com",
        to: adminEmail,
        subject: `Payment Received – ${clientName} (${bookingReference})`,
        react: (
            <PaymentReceivedEmail
                adminName={adminName}
                clientName={clientName}
                bookingReference={bookingReference}
                serviceName={serviceName}
                bookingDate={bookingDate}
                bookingTime={bookingTime}
                amountPaid={amountPaid}
                provider={provider}
                bookingId={bookingId}
            />
        ),
    });
};
