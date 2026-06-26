import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { sendFeedbackRequestEmail } from "@/features/feedback/emails/send-feedback-request-email";
import { getGoogleReviewLink } from "@/features/feedback/server/review-settings";
import { sendSMS } from "@/lib/arkesal";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Deliberately a manual, admin-triggered action rather than an automatic
// "booking completed -> ask for review" hook: not every completed booking
// was a good experience, and the admin is best placed to judge which
// customers should actually be asked for a public review.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok) return auth.response;

        const bookingId = (await params).id;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
        }

        if (booking.status !== "COMPLETED") {
            return NextResponse.json(
                { success: false, message: "Feedback can only be requested for completed bookings" },
                { status: 400 }
            );
        }

        if (!booking.clientEmail && !booking.clientPhone) {
            return NextResponse.json(
                { success: false, message: "Booking has no email or phone on file" },
                { status: 400 }
            );
        }

        const serviceNames = booking.services.map((s) => s.service.name).join(", ");
        const reviewLink = await getGoogleReviewLink();

        let emailResult = null;
        if (booking.clientEmail) {
            emailResult = await sendFeedbackRequestEmail(booking.clientEmail, booking.clientName, serviceNames, reviewLink)
                .catch((err) => {
                    console.error("Failed to send feedback request email:", err);
                    return null;
                });
        }

        let smsResult = null;
        if (booking.clientPhone) {
            const message = reviewLink
                ? `Hi ${booking.clientName}, thank you for choosing Polaris for your ${serviceNames}! We'd love it if you could share your experience: ${reviewLink}`
                : `Hi ${booking.clientName}, thank you for choosing Polaris for your ${serviceNames}! We'd love to hear how it went — feel free to reply and let us know.`;

            smsResult = await sendSMS({ recipients: [booking.clientPhone], message }).catch((err) => {
                console.error("Failed to send feedback request SMS:", err);
                return null;
            });
        }

        await prisma.booking.update({
            where: { id: booking.id },
            data: { feedbackRequestedAt: new Date() },
        });

        return NextResponse.json({
            success: true,
            message: "Feedback request sent",
            data: {
                emailStatus: booking.clientEmail ? (emailResult?.data?.id ? "sent" : "failed") : "no_email",
                smsStatus: smsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone"),
            },
        });
    } catch (error: any) {
        console.error("Error requesting feedback:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to request feedback" },
            { status: 500 }
        );
    }
}
