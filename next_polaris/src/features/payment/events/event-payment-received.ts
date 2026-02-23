import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceivedEmail } from "../emails/send-payment-received-email";
import { UserRole } from "@generated/prisma/client";

export type PaymentReceivedEventArgs = {
    data: {
        bookingId: string;
        amountPaid: number;
        provider: string;
    };
};

export const paymentReceivedEvent = inngest.createFunction(
    { id: "payment-received-admin-notify" },
    { event: "app/payment.payment-received" },
    async ({ event }) => {
        const { bookingId, amountPaid, provider } = event.data;

        // Fetch the booking with its service
        const booking = await prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: { service: true },
        });

        // Fetch all admin users
        const admins = await prisma.user.findMany({
            where: { role: UserRole.ADMIN },
            select: { email: true, username: true },
        });

        if (admins.length === 0) {
            console.log("No admin users found to notify for booking", bookingId);
            return { message: "No admins to notify" };
        }

        // Send an email to each admin
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
            failed.forEach((r) => {
                if (r.status === "rejected") console.error(r.reason);
            });
        } else {
            console.log(`Admin payment notification sent to ${admins.length} admin(s) for booking ${bookingId}`);
        }

        return { notified: admins.length, failed: failed.length };
    }
);
