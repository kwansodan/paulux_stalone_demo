import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';
import { inngest } from '@/lib/inngest';
import { PaymentProvider } from '@generated/prisma/client';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-paystack-signature');
        if (!signature) {
            return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
        }

        const body = await req.json();

        // Verify signature against PRIMARY_PAYSTACK
        const isValid = verifyPaystackSignature(signature, body, PaymentProvider.PRIMARY_PAYSTACK);

        if (!isValid) {
            console.error('Invalid PRIMARY Paystack webhook signature');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        console.log(`Received PRIMARY Paystack event: ${event}`);

        const reference = data.reference || data.transaction_reference;

        if (!reference) {
            console.error(`No reference found for event: ${event}`);
            return NextResponse.json({ message: 'No reference found in payload' }, { status: 400 });
        }

        // Try to find an invoice and log the receipt
        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber: reference },
            include: { booking: true }
        });

        if (invoice) {
            const { auditLogService } = await import('@/features/payment/server/audit-log.service');
            await auditLogService.logAction({
                action: "WEBHOOK_RECEIVED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                metadata: { provider: PaymentProvider.PRIMARY_PAYSTACK, event, body }
            });
        }

        // Handle successful payment
        if (event === 'charge.success') {
            const { reference, status, amount } = data;

            if (status === 'success') {
                try {
                    if (invoice) {
                        console.log(`Found invoice ${invoice.invoiceNumber}, processing via unified flow`);
                        await paymentService.confirmInvoicePayment(invoice.id, reference, data);
                        // Notify all admins
                        await inngest.send({
                            name: "app/payment.payment-received",
                            data: {
                                bookingId: invoice.bookingId,
                                amountPaid: amount / 100, // Paystack amounts are in kobo
                                provider: PaymentProvider.PRIMARY_PAYSTACK,
                            },
                        });
                    } else {
                        // Fallback to legacy flow
                        const result = await paymentService.processSuccessfulPayment(reference, data);
                        if (!result.success) {
                            return NextResponse.json(
                                { message: result.message || 'Payment processing failed' },
                                { status: 404 }
                            );
                        }
                    }
                    console.log(`Payment successfully processed via PRIMARY webhook for reference: ${reference}`);
                } catch (serviceError: any) {
                    console.error('Error in payment service (PRIMARY):', serviceError);
                }
            }
        }

        // Handle failed payment
        if (event === 'charge.failed') {
            const { reference } = data;

            console.log(`Payment failed for reference: ${reference} (PRIMARY)`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: PaymentProvider.PRIMARY_PAYSTACK,
                        providerRef: reference,
                    },
                },
            });

            if (payment) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'FAILED',
                        rawPayload: {
                            event,
                            data,
                            processedAt: new Date().toISOString(),
                        },
                    },
                });

                await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        paymentStatus: 'FAILED',
                    },
                });

                console.log(`Updated payment ${payment.id} and booking to FAILED (PRIMARY)`);
            }
        }

        // Handle refund processed
        if (event === 'refund.processed') {
            const { transaction_reference, amount, currency } = data;

            console.log(`Refund processed for transaction: ${transaction_reference} (PRIMARY)`);

            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: PaymentProvider.PRIMARY_PAYSTACK,
                        providerRef: transaction_reference,
                    },
                },
            });

            if (payment) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'REFUNDED',
                        rawPayload: {
                            ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                            refund: {
                                status: 'processed',
                                event,
                                data,
                                amount,
                                currency,
                                processedAt: new Date().toISOString(),
                            },
                        },
                    },
                });

                await paymentService.refreshBookingPaymentStatus(payment.bookingId);
                console.log(`Updated payment ${payment.id} to REFUNDED (PRIMARY)`);
            }
        }

        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

    } catch (error: any) {
        console.error('PRIMARY Webhook processing error:', error);
        return NextResponse.json(
            { message: 'Webhook error', error: error.message },
            { status: 500 }
        );
    }
}
