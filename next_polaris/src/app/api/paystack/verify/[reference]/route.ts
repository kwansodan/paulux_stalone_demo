import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';

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

        // Verify transaction with Paystack
        const verificationResponse = await verifyTransaction(reference);

        if (!verificationResponse.status) {
            return NextResponse.json(
                { message: 'Transaction verification failed', data: verificationResponse },
                { status: 400 }
            );
        }

        const { data } = verificationResponse;

        // Find the payment record in our database
        const payment = await prisma.payment.findUnique({
            where: {
                provider_providerRef: {
                    provider: 'PAYSTACK',
                    providerRef: reference,
                },
            },
            include: {
                booking: {
                    include: {
                        service: true,
                    },
                },
            },
        });

        // Update payment status if it differs from Paystack
        if (payment && data.status === 'success' && payment.status !== 'PAID') {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    rawPayload: {
                        ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                        verification: {
                            verifiedAt: new Date().toISOString(),
                            paystackData: data,
                        },
                    },
                },
            });

            // Update booking status
            await prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction verified successfully',
            data: {
                paystack: data,
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
