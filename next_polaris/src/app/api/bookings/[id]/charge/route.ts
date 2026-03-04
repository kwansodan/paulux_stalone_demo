import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentProcessingService } from "@/features/payment/server/payment-processing.service";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";
import { BookingStatus, PaymentProvider, PaymentStatus, SupportedCurrency } from "@generated/prisma/client";
import { Decimal, JsonValue } from "@prisma/client/runtime/client";
import { NextRequest, NextResponse } from "next/server";

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
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        const bookingPaymentStatus = calculatePaymentStatus(booking)
        if (bookingPaymentStatus === PaymentStatus.PAID) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid" },
                { status: 400 }
            );
        }

        const servicePrice = Number(booking.service.price);
        let amountToCharge = servicePrice;
        let transactionType = 'initial';

        // Filter for PAID payments
        const paidPayments = booking.payments?.filter(p => p.status === PaymentStatus.PAID) || [];
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        const remainingBalance = servicePrice - totalPaid;

        if (remainingBalance <= 0) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid in full" },
                { status: 400 }
            );
        }

        if (totalPaid === 0) {
            // First payment: Check if there's a minimum deposit
            const minDepositPercent = booking.minDepositPercent ?? booking.service.minDepositPercent ?? 0;
            if (minDepositPercent > 0 && minDepositPercent < 100) {
                amountToCharge = servicePrice * (minDepositPercent / 100);
            }
        } else {
            // Subsequent payment: Charge the remaining balance
            amountToCharge = remainingBalance;
            transactionType = 'subsequent';
        }

        const paymentResult = await paymentProcessingService.initializePayment({
            bookingId: booking.id,
            email: booking.clientEmail,
            amount: amountToCharge,
            bookingReference: booking.bookingReference,
            transactionType,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/confirmation`
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
            return NextResponse.json({
                success: true,
                message: "Payment initialized",
                data: { paymentUrl: paymentResult.paymentUrl }
            });
        } else {
            return NextResponse.json(
                { success: false, message: paymentResult.message || "Failed to initialize payment" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in charge endpoint:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

