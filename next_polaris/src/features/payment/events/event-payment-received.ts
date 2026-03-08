import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceivedEmail } from "../emails/send-payment-received-email";
import { UserRole } from "@generated/prisma/client";

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

        return { notified: emailResults.total, failed: emailResults.failed };
    }
);
