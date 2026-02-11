import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-paystack-signature');
        if (!signature) {
            return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
        }

        const body = await req.json();

        // Verify signature
        const isValid = verifyPaystackSignature(signature, body);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        console.log(`Received Paystack event: ${event}`);

        // Handle successful payment
        if (event === 'charge.success') {
            const { reference, status, amount, paid_at, channel } = data;

            if (status === 'success') {
                // Find the payment record by provider reference
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

                if (!payment) {
                    console.error(`Payment not found for reference: ${reference}`);
                    return NextResponse.json(
                        { message: 'Payment not found' },
                        { status: 404 }
                    );
                }

                // Update payment status to PAID
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'PAID',
                        rawPayload: {
                            event,
                            data,
                            processedAt: new Date().toISOString(),
                        },
                    },
                });

                console.log(`Updated payment ${payment.id} to PAID`);

                // Update booking status and paymentStatus
                const updatedBooking = await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        status: 'CONFIRMED',
                        paymentStatus: 'PAID',
                    },
                    include: {
                        service: true,
                    },
                });

                console.log(`Updated booking ${updatedBooking.bookingReference} to CONFIRMED with PAID status`);

                // Create Google Calendar Event if not already created
                if (!updatedBooking.googleEventId) {
                    try {
                        const eventId = await createCalendarEvent(updatedBooking);
                        if (eventId) {
                            await prisma.booking.update({
                                where: { id: updatedBooking.id },
                                data: { googleEventId: eventId },
                            });
                            console.log(`Created Google Calendar event ${eventId} for booking ${updatedBooking.bookingReference}`);
                        }
                    } catch (calendarError) {
                        console.error('Failed to create calendar event:', calendarError);
                        // Don't fail the webhook if calendar creation fails
                    }
                }
            }
        }

        // Handle failed payment
        if (event === 'charge.failed') {
            const { reference, status } = data;

            console.log(`Payment failed for reference: ${reference}`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: 'PAYSTACK',
                        providerRef: reference,
                    },
                },
            });

            if (payment) {
                // Update payment status to FAILED
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

                console.log(`Updated payment ${payment.id} to FAILED`);

                // Update booking paymentStatus to FAILED
                await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        paymentStatus: 'FAILED',
                    },
                });

                console.log(`Updated booking payment status to FAILED`);
            } else {
                console.error(`Payment not found for failed reference: ${reference}`);
            }
        }

        // Handle refund pending
        if (event === 'refund.pending') {
            const { transaction_reference } = data;

            console.log(`Refund pending for transaction: ${transaction_reference}`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: 'PAYSTACK',
                        providerRef: transaction_reference,
                    },
                },
            });

            if (payment) {
                // Store refund pending data in rawPayload
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        rawPayload: {
                            ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                            refund: {
                                status: 'pending',
                                event,
                                data,
                                processedAt: new Date().toISOString(),
                            },
                        },
                    },
                });

                console.log(`Logged refund pending for payment ${payment.id}`);
            }
        }

        // Handle refund processing
        if (event === 'refund.processing') {
            const { transaction_reference } = data;

            console.log(`Refund processing for transaction: ${transaction_reference}`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: 'PAYSTACK',
                        providerRef: transaction_reference,
                    },
                },
            });

            if (payment) {
                // Update rawPayload with processing status
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        rawPayload: {
                            ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                            refund: {
                                status: 'processing',
                                event,
                                data,
                                processedAt: new Date().toISOString(),
                            },
                        },
                    },
                });

                console.log(`Updated refund status to processing for payment ${payment.id}`);
            }
        }

        // Handle refund processed (successful)
        if (event === 'refund.processed') {
            const { transaction_reference, amount, currency } = data;

            console.log(`Refund processed for transaction: ${transaction_reference}`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: 'PAYSTACK',
                        providerRef: transaction_reference,
                    },
                },
            });

            if (payment) {
                // Update payment status to REFUNDED
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

                console.log(`Updated payment ${payment.id} to REFUNDED`);

                // Update booking paymentStatus to REFUNDED
                await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        paymentStatus: 'REFUNDED',
                    },
                });

                console.log(`Updated booking payment status to REFUNDED`);
            } else {
                console.error(`Payment not found for refund reference: ${transaction_reference}`);
            }
        }

        // Handle refund failed
        if (event === 'refund.failed') {
            const { transaction_reference } = data;

            console.error(`Refund failed for transaction: ${transaction_reference}`);

            // Find the payment record
            const payment = await prisma.payment.findUnique({
                where: {
                    provider_providerRef: {
                        provider: 'PAYSTACK',
                        providerRef: transaction_reference,
                    },
                },
            });

            if (payment) {
                // Keep payment as PAID since refund failed
                // Store failure information in rawPayload
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        rawPayload: {
                            ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                            refund: {
                                status: 'failed',
                                event,
                                data,
                                processedAt: new Date().toISOString(),
                            },
                        },
                    },
                });

                console.log(`Logged refund failure for payment ${payment.id}, payment remains PAID`);
            }
        }

        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { message: 'Webhook error', error: error.message },
            { status: 500 }
        );
    }
}

