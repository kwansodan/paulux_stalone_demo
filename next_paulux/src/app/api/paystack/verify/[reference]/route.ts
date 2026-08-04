import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ reference: string }> }
) {
    try {
        const awaitedParams = await params;
        const { reference } = awaitedParams;

        if (!reference) {
            return NextResponse.json(
                { message: 'Transaction reference is required' },
                { status: 400 }
            );
        }

        // Re-verify with Paystack and capture the payment if it succeeded but wasn't recorded yet
        // (e.g. webhook missed/delayed)
        const syncResult = await paymentService.verifyAndSyncTransaction(reference);

        if (!syncResult.success) {
            return NextResponse.json(
                { message: syncResult.message || 'Transaction verification failed' },
                { status: 400 }
            );
        }

        // Find the payment record in our database (post-sync) for the response payload
        const payment = await prisma.payment.findFirst({
            where: { providerRef: reference },
            include: {
                booking: {
                    include: {
                        services: {
                            include: {
                                service: true
                            }
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction verified successfully',
            data: {
                paystackStatus: syncResult.paystackStatus,
                payment: payment ? {
                    id: payment.id,
                    status: payment.status,
                    amount: payment.amount.toString(),
                    bookingId: payment.bookingId,
                } : null,
            },
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to verify payment',
                error: error.message
            },
            { status: 500 }
        );
    }
}
