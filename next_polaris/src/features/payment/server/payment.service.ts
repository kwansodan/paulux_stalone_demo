
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";

export class PaymentService {
    /**
     * Process a successful payment from Paystack.
     * Updates payment status, confirms booking, and syncs to Google Calendar.
     * idempotent: Safe to call multiple times for the same reference.
     */
    async processSuccessfulPayment(reference: string, paystackData: any) {
        console.log(`Processing successful payment for reference: ${reference}`);

        // 1. Find the payment record
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
            return { success: false, message: 'Payment not found' };
        }

        // 2. Update payment status to PAID if not already
        if (payment.status !== 'PAID') {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    rawPayload: {
                        ...(typeof payment.rawPayload === 'object' ? payment.rawPayload : {}),
                        success_processing: {
                            processedAt: new Date().toISOString(),
                            data: paystackData,
                        },
                    },
                },
            });
            console.log(`Updated payment ${payment.id} to PAID`);
        }

        // 3. Update booking status to CONFIRMED if not already
        // We fetch the booking again or use the included one, but we need to update it
        let booking = payment.booking;

        if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
            booking = await prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                },
                include: {
                    service: true,
                },
            });
            console.log(`Updated booking ${booking.bookingReference} to CONFIRMED`);
        }

        // 4. Create Google Calendar Event if not already created
        if (!booking.googleEventId) {
            try {
                console.log(`Attempting to create calendar event for booking ${booking.bookingReference}`);
                const eventId = await createCalendarEvent(booking);

                if (eventId) {
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { googleEventId: eventId },
                    });
                    console.log(`Created Google Calendar event ${eventId}`);
                } else {
                    console.warn(`Failed to create calendar event for booking ${booking.bookingReference} (no event ID returned)`);
                }
            } catch (calendarError) {
                console.error('Failed to create calendar event:', calendarError);
                // We catch here so we don't fail the entire process if calendar fails
            }
        } else {
            console.log(`Calendar event already exists: ${booking.googleEventId}`);
        }

        return { success: true, paymentId: payment.id, bookingId: booking.id };
    }
}

export const paymentService = new PaymentService();
