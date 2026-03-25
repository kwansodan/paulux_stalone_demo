import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';
import { PaymentProvider, Prisma } from '@generated/prisma/client';

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

        // 1. Identify which provider this reference belongs to
        // We can check the Payment table or Invoice table
        let provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK; // Default

        const existingPayment = await prisma.payment.findFirst({
            where: { providerRef: reference }
        });

        if (existingPayment) {
            provider = existingPayment.provider as PaymentProvider;
        } else {
            // Check invoice if payment doesn't exist yet
            const invoice = await prisma.invoice.findUnique({
                where: { invoiceNumber: reference }
            });
            if (invoice?.gateway) {
                provider = invoice.gateway as PaymentProvider;
            }
        }

        // 2. Verify transaction with Paystack (using identified provider)
        const verificationResponse = await verifyTransaction(reference, provider);

        if (!verificationResponse.status) {
            return NextResponse.json(
                { message: 'Transaction verification failed', data: verificationResponse },
                { status: 400 }
            );
        }

        const { data } = verificationResponse;

        // 3. Find the payment record in our database
        const payment = await prisma.payment.findUnique({
            where: {
                provider_providerRef: {
                    provider: provider,
                    providerRef: reference,
                },
            },
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

        // Update payment status if it differs from Paystack
        if (data.status === 'success') {
            try {
                if (payment && payment.status !== 'PAID') {
                    const result = await paymentService.processSuccessfulPayment(reference, data as Prisma.InputJsonValue);
                    if (!result.success) {
                        console.error(`Service failed to process payment: ${result.message}`);
                    }
                } else if (!payment) {
                    const invoice = await prisma.invoice.findUnique({
                        where: { invoiceNumber: reference }
                    });
                    if (invoice && invoice.status !== 'PAID') {
                        const actualAmount = data.amount ? data.amount / 100 : undefined;
                        await paymentService.confirmInvoicePayment(
                            invoice.id,
                            reference,
                            data as Prisma.InputJsonValue,
                            actualAmount
                        );
                    }
                }
            } catch (error) {
                console.error('Error processing payment in verify endpoint:', error);
            }
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
