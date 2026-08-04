import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentProcessingService } from "@/features/payment/server/payment-processing.service";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";
import { calculateBookingTotal } from "@/features/booking/utils/helpers";
import { getRequiredDeposit } from "@/features/payment/server/deposit-settings";
import { customerBookingSummaryPath } from "@/app/paths";
import { getBaseUrl } from "@/utils/url";
import { PaymentStatus } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Public — reachable from the customer's own booking-summary page (no admin
// session). Scoped to SCHEDULED bookings only: walk-ins are confirmed at
// creation and paid in person via the admin's own Cash/Charge flow, so a
// self-service deposit link doesn't apply to them.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const rateLimited = checkRateLimit(request, "pay-deposit", 10, 10 * 60 * 1000)
        if (rateLimited) return rateLimited

        const bookingId = (await params).id;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
        }

        if (booking.bookingType !== "SCHEDULED") {
            return NextResponse.json({ success: false, message: "This booking does not require an online deposit" }, { status: 400 });
        }

        const bookingPaymentStatus = calculatePaymentStatus(booking);
        if (bookingPaymentStatus === PaymentStatus.PAID) {
            return NextResponse.json({ success: false, message: "Booking is already paid" }, { status: 400 });
        }

        const totalPrice = calculateBookingTotal(booking);
        const paidPayments = booking.payments?.filter((p) => p.status === PaymentStatus.PAID) || [];
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingBalance = Math.max(0, totalPrice - totalPaid);

        if (remainingBalance <= 0) {
            return NextResponse.json({ success: false, message: "Booking is already paid in full" }, { status: 400 });
        }

        const requiredDeposit = await getRequiredDeposit(booking);
        const amountToCharge = requiredDeposit > 0 && requiredDeposit < remainingBalance
            ? requiredDeposit
            : remainingBalance;

        if (!booking.clientEmail) {
            return NextResponse.json({ success: false, message: "Booking has no email on file" }, { status: 400 });
        }

        const callbackUrl = `${getBaseUrl()}${customerBookingSummaryPath(booking.id)}?from=payment`;

        const paymentResult = await paymentProcessingService.initializePayment({
            bookingId: booking.id,
            email: booking.clientEmail,
            amount: amountToCharge,
            bookingReference: booking.bookingReference,
            transactionType: totalPaid > 0 ? "subsequent" : "initial",
            callbackUrl,
            phone: booking.clientPhone ?? undefined,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
            return NextResponse.json({
                success: true,
                data: { paymentUrl: paymentResult.paymentUrl, amount: amountToCharge },
            });
        }

        return NextResponse.json(
            { success: false, message: paymentResult.message || "Failed to initialize payment" },
            { status: 500 }
        );
    } catch (error: any) {
        console.error("Error in pay-deposit endpoint:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
