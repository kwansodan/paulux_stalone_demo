import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentProcessingService } from "@/features/payment/server/payment-processing.service";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";
import { BookingStatus, PaymentProvider, PaymentStatus, SupportedCurrency } from "@generated/prisma/client";
import { Decimal, JsonValue } from "@prisma/client/runtime/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0);
        let amountToCharge = totalPrice;
        let transactionType = 'initial';

        // Filter for PAID payments
        const paidPayments = booking.payments?.filter(p => p.status === PaymentStatus.PAID) || [];
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        const remainingBalance = totalPrice - totalPaid;

        if (remainingBalance <= 0) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid in full" },
                { status: 400 }
            );
        }

        // Admin can override the charge amount (must be > 0 and <= remaining balance)
        const body = await request.json().catch(() => ({}));
        const customAmount = body?.amount ? Number(body.amount) : null;

        if (customAmount !== null) {
            if (isNaN(customAmount) || customAmount <= 0) {
                return NextResponse.json(
                    { success: false, message: "Amount must be greater than 0" },
                    { status: 400 }
                );
            }
            if (customAmount > remainingBalance) {
                return NextResponse.json(
                    { success: false, message: `Amount cannot exceed remaining balance of GHS ${remainingBalance.toFixed(2)}` },
                    { status: 400 }
                );
            }
            amountToCharge = customAmount;
            transactionType = totalPaid > 0 ? 'subsequent' : 'initial';
        } else if (totalPaid === 0) {
            // First payment: Calculate min deposit amount
            const minDepositAmount = booking.minDepositPercent != null
                ? totalPrice * (booking.minDepositPercent / 100)
                : booking.services.reduce((sum, s) => sum + (Number(s.priceAtBooking) * (s.service.minDepositPercent / 100)), 0);

            if (minDepositAmount > 0 && minDepositAmount < totalPrice) {
                amountToCharge = minDepositAmount;
            }
        } else {
            // Subsequent payment: Charge the remaining balance
            amountToCharge = remainingBalance;
            transactionType = 'subsequent';
        }

        // For walk-in bookings without an email, fall back to the configured walk-in email
        let chargeEmail = booking.clientEmail
        if (!chargeEmail) {
            const walkinSetting = await prisma.systemSetting.findUnique({ where: { key: "walkin_email" } })
            chargeEmail = walkinSetting?.value || "walkin@polarisbeautylounge.com"
        }

        const paymentResult = await paymentProcessingService.initializePayment({
            bookingId: booking.id,
            email: chargeEmail,
            amount: amountToCharge,
            bookingReference: booking.bookingReference,
            transactionType,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/confirmation`,
            phone: booking.clientPhone ?? undefined,
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

