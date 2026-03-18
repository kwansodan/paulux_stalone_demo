import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceivedEmail } from "../emails/send-payment-received-email";
import { UserRole } from "@generated/prisma/client";
import { sendSMS } from "@/lib/arkesal";
import { formatDate, formatTime } from "@/features/booking/utils/helpers";
import { customerBookingSummaryPath } from "@/app/paths";
import { getBaseUrl } from "@/utils/url";

export const paymentReceivedEvent = inngest.createFunction(
    { id: "payment-received-admin-notify" },
    { event: "app/payment.payment-received" },
    async ({ event, step }) => {
        const { bookingId, amountPaid, provider } = event.data;

        // Fetch the booking with its service
        const booking = await step.run("fetch-booking", async () => {
            return prisma.booking.findUniqueOrThrow({
                where: { id: bookingId },
                include: { service: true },
            });
        });

        // Fetch all admin users
        const admins = await step.run("fetch-admins", async () => {
            const users = await prisma.user.findMany({
                where: { role: UserRole.ADMIN },
                select: { email: true, username: true },
            });
            if (users.length === 0) {
                console.log("No admin users found to notify for booking", bookingId);
            }
            return users;
        });

        if (admins.length === 0) {
            return { message: "No admins to notify" };
        }

        // Send an email to each admin
        const emailResults = await step.run("notify-admins", async () => {
            const results = await Promise.allSettled(
                admins.map((admin) =>
                    sendPaymentReceivedEmail(
                        admin.email,
                        admin.username,
                        booking.clientName,
                        booking.bookingReference,
                        booking.service.name,
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
                console.error(`Failed to send admin notification emails: ${failed.length} of ${admins.length}`);
            }
            return {
                total: admins.length,
                sent: results.length - failed.length,
                failed: failed.length
            };
        });

        // 4. Notify customer via SMS
        let customerSmsResult = null;
        if (booking.clientPhone) {
            customerSmsResult = await step.run("notify-customer-sms", async () => {
                const dateFormatted = formatDate(booking.bookingDate);
                const timeFormatted = formatTime(booking.bookingTime);
                const summaryLink = getBaseUrl() + customerBookingSummaryPath(booking.id);

                const message = `Hi ${booking.clientName}, your booking for ${booking.service.name} on ${dateFormatted} at ${timeFormatted} is confirmed. Ref: ${booking.bookingReference}. Details: ${summaryLink}`;

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
            smsStatus: customerSmsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone")
        };
    }
);
