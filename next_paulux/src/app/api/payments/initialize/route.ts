import { NextRequest, NextResponse } from 'next/server';
import { paymentProcessingService } from '@/features/payment/server/payment-processing.service';
import { bookingRepository } from '@/features/booking/server/booking.repository';
import { calculateBookingTotal } from '@/features/booking/utils/helpers';
import { getRequiredDeposit } from '@/features/payment/server/deposit-settings';
import { PaymentStatus } from '@generated/prisma/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bookingId, email, amount, bookingReference, callbackUrl, transactionType, phone } = body;

        if (!bookingId || !email || !amount || !bookingReference) {
            return NextResponse.json(
                { message: 'Missing required fields: bookingId, email, amount, bookingReference' },
                { status: 400 }
            );
        }

        const requestedAmount = Number(amount)

        // Only the customer-facing first payment is allowed to be a partial deposit —
        // enforce the minimum here so the deposit requirement (global override or
        // per-service/package) can't be bypassed by sending a smaller `amount` directly.
        if ((transactionType ?? 'initial') === 'initial') {
            const booking = await bookingRepository.findById(bookingId)
            if (!booking) {
                return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
            }

            const totalPrice = calculateBookingTotal(booking)
            const paidPayments = booking.payments?.filter((p) => p.status === PaymentStatus.PAID) || []
            const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
            const remainingBalance = Math.max(0, totalPrice - totalPaid)

            const requiredDeposit = await getRequiredDeposit(booking)
            const minimumAllowed = requiredDeposit > 0 && requiredDeposit < remainingBalance
                ? requiredDeposit
                : remainingBalance

            if (requestedAmount < minimumAllowed) {
                return NextResponse.json(
                    { message: `Amount must be at least the required deposit of GHS ${minimumAllowed.toFixed(2)}` },
                    { status: 400 }
                );
            }
        }

        // Initialize payment via unified processing service
        // This handles gateway selection (routing %), invoice creation, and failover
        const result = await paymentProcessingService.initializePayment({
            bookingId,
            email,
            amount: Number(amount),
            bookingReference,
            callbackUrl,
            transactionType: transactionType || 'initial',
            phone,
        });

        if (!result.success) {
            return NextResponse.json(
                { message: result.message || 'Failed to initialize payment' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            paymentUrl: result.paymentUrl,
            gateway: result.gateway,
            invoiceNumber: result.invoiceNumber
        });

    } catch (error: any) {
        console.error('Unified payment initialization error:', error);
        return NextResponse.json(
            { message: 'Internal server error during payment initialization', error: error.message },
            { status: 500 }
        );
    }
}
