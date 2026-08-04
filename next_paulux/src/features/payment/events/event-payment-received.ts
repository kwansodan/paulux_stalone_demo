import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceivedEmail } from "../emails/send-payment-received-email";
import { sendCustomerReceiptEmail } from "../emails/send-customer-receipt-email";
import { PaymentStatus, PaymentProvider } from "@generated/prisma/client";
import { getPaymentNotificationRecipients } from "../server/payment-recipients";
import { sendSMS } from "@/lib/arkesal";
import { formatDate, formatTime } from "@/features/booking/utils/helpers";
import { customerBookingSummaryPath } from "@/app/paths";
import { getBaseUrl } from "@/utils/url";

export const paymentReceivedEvent = inngest.createFunction(
    { id: "payment-received-admin-notify" },
    { event: "app/payment.payment-received" },
    async ({ event, step }) => {
        const { bookingId, amountPaid, provider, manualMethodName } = event.data;

        // Fetch the booking with its services and payments
        const booking = await step.run("fetch-booking", async () => {
            return prisma.booking.findUniqueOrThrow({
                where: { id: bookingId },
                include: {
                    services: { include: { service: true } },
                    payments: { where: { status: PaymentStatus.PAID } },
                },
            });
        });

        // Resolve who should be notified: the configured payment-notification
        // recipient list, or all admins if that list is empty (see helper).
        const recipients = await step.run("fetch-recipients", async () => {
            const list = await getPaymentNotificationRecipients();
            if (list.length === 0) {
                console.log("No payment-notification recipients found for booking", bookingId);
            }
            return list;
        });

        const serviceNamesList = booking.services.map(s => s.service.name);
        const serviceNames = serviceNamesList.join(", ");

        // Human-readable payment method label
        const paymentMethod =
            provider === PaymentProvider.MANUAL
                ? (manualMethodName || "Manual")
                : (provider === PaymentProvider.PRIMARY_PAYSTACK || provider === PaymentProvider.SECONDARY_PAYSTACK)
                    ? "Mobile Money"
                    : "Online Payment";

        // Send a notification email to each recipient
        const emailResults = await step.run("notify-recipients", async () => {
            if (recipients.length === 0) {
                return { total: 0, sent: 0, failed: 0 };
            }
            const results = await Promise.allSettled(
                recipients.map((recipient) =>
                    sendPaymentReceivedEmail(
                        recipient.email,
                        recipient.name,
                        booking.clientName,
                        booking.bookingReference,
                        serviceNames,
                        booking.bookingDate,
                        booking.bookingTime,
                        amountPaid,
                        provider,
                        booking.id,
                    )
                )
            );

            const failed = results.filter((r) => r.status === "rejected");
            if (failed.length > 0) {
                console.error(`Failed to send payment notification emails: ${failed.length} of ${recipients.length}`);
            }
            return {
                total: recipients.length,
                sent: results.length - failed.length,
                failed: failed.length
            };
        });

        // Send receipt email to the customer (if they have an email address)
        let customerEmailResult = null;
        if (booking.clientEmail) {
            customerEmailResult = await step.run("send-customer-receipt", async () => {
                const totalAmount = booking.services.reduce(
                    (sum, s) => sum + Number(s.priceAtBooking), 0
                );
                const totalPaid = booking.payments.reduce(
                    (sum, p) => sum + Number(p.amount), 0
                );
                const remainingBalance = Math.max(0, totalAmount - totalPaid);
                const dateFormatted = formatDate(booking.bookingDate);

                const result = await sendCustomerReceiptEmail(
                    booking.clientEmail!,
                    booking.clientName,
                    booking.bookingReference,
                    serviceNamesList,
                    dateFormatted,
                    amountPaid,
                    paymentMethod,
                    remainingBalance,
                );

                if (!result?.data?.id) {
                    console.error("Failed to send customer receipt email for booking", bookingId);
                }
                return result;
            });
        }

        // Notify customer via SMS
        let customerSmsResult = null;
        if (booking.clientPhone) {
            customerSmsResult = await step.run("notify-customer-sms", async () => {
                const dateFormatted = formatDate(booking.bookingDate);
                const timeFormatted = formatTime(booking.bookingTime);
                const summaryLink = getBaseUrl() + customerBookingSummaryPath(booking.id);

                const totalAmount = booking.services.reduce(
                    (sum, s) => sum + Number(s.priceAtBooking), 0
                );
                const totalPaid = booking.payments.reduce(
                    (sum, p) => sum + Number(p.amount), 0
                );
                const remaining = Math.max(0, totalAmount - totalPaid);

                const message = remaining > 0
                    ? `Hello ${booking.clientName}, Paulux Booking confirms receipt of your payment of GHS ${amountPaid.toFixed(2)} for ${serviceNames}. Method: ${paymentMethod}. Date: ${dateFormatted}. Outstanding: GHS ${remaining.toFixed(2)}. Ref: ${booking.bookingReference}. Enquiries: instagram.com/pauluxbooking`
                    : `Hello ${booking.clientName}, Paulux Booking confirms receipt of your payment of GHS ${amountPaid.toFixed(2)} for ${serviceNames}. Method: ${paymentMethod}. Date: ${dateFormatted}. Ref: ${booking.bookingReference}. Thank you for choosing us! Enquiries: instagram.com/pauluxbooking`;

                const result = await sendSMS({
                    recipients: [booking.clientPhone],
                    message
                });

                if (!result?.success) {
                    console.error("Failed to send customer confirmation SMS:", result);
                    // We don't throw here to avoid failing the whole Inngest function
                    // but we return the failure status
                }
                return result;
            });
        }

        return {
            notified: emailResults.total,
            failed: emailResults.failed,
            customerReceiptEmail: booking.clientEmail ? (customerEmailResult?.data?.id ? "sent" : "failed") : "no_email",
            smsStatus: customerSmsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone"),
        };
    }
);
