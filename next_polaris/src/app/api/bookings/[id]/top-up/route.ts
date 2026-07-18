import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { subsequentPaymentService } from "@/features/payment/server/subsequent-payment.service";
import { PaymentStatus } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "bookings.view");
        if (!auth.ok) return auth.response;

        const bookingId = (await params).id;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        // Calculate total amount paid
        const paidPayments = booking.payments.filter(p => p.status === PaymentStatus.PAID);
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0);
        const remainingAmount = totalPrice - totalPaid;

        if (remainingAmount <= 0) {
            return NextResponse.json(
                { success: false, message: "Booking is already fully paid" },
                { status: 400 }
            );
        }

        const paymentResult = await subsequentPaymentService.processTopUp({
            bookingId: booking.id,
            amount: remainingAmount,
            description: `Payment for remaining balance of ${booking.bookingReference}`
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
            return NextResponse.json({
                success: true,
                message: "Top-up payment initialized",
                data: { paymentUrl: paymentResult.paymentUrl }
            });
        } else {
            return NextResponse.json(
                { success: false, message: paymentResult.message || "Failed to initialize top-up payment" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in top-up endpoint:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
