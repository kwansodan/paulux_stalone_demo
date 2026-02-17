import { NextRequest, NextResponse } from 'next/server';
import { paymentProcessingService } from '@/features/payment/server/payment-processing.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bookingId, email, amount, bookingReference, callbackUrl, transactionType } = body;

        if (!bookingId || !email || !amount || !bookingReference) {
            return NextResponse.json(
                { message: 'Missing required fields: bookingId, email, amount, bookingReference' },
                { status: 400 }
            );
        }

        // Initialize payment via unified processing service
        // This handles gateway selection (routing %), invoice creation, and failover
        const result = await paymentProcessingService.initializePayment({
            bookingId,
            email,
            amount: Number(amount),
            bookingReference,
            callbackUrl,
            transactionType: transactionType || 'initial'
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
