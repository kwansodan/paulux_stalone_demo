import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { calculatePaymentStatus } from "../utils/helpers";
import { auditLogService } from "./audit-log.service";
import { PaymentProvider } from "@generated/prisma/client";
import { initiateRefund as initiatePaystackRefund } from "@/lib/paystack";

export class PaymentService {
    /**
     * Process a successful payment from Paystack.
     * Updates payment status, confirms booking, and syncs to Google Calendar.
     * idempotent: Safe to call multiple times for the same reference.
     */
    async processSuccessfulPayment(reference: string, data: any, provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK) {
        console.log(`Processing successful payment for reference: ${reference} via ${provider}`);

        // 1. Find the payment record
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
                        service: true,
                        payments: true,
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
                            data: data,
                        },
                    },
                },
            });
            console.log(`Updated payment ${payment.id} to PAID`);
        }

        // 3. Update booking status to CONFIRMED if not already
        let booking = payment.booking;
        await this.refreshBookingPaymentStatus(payment.bookingId);

        if (booking.status !== 'CONFIRMED') {
            booking = await prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: 'CONFIRMED',
                },
                include: {
                    service: true,
                    payments: true
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
                }
            } catch (calendarError) {
                console.error('Failed to create calendar event:', calendarError);
            }
        }

        return { success: true, paymentId: payment.id, bookingId: booking.id };
    }

    async confirmInvoicePayment(invoiceId: string, providerRef: string, payload: any, actualAmount?: number) {
        console.log(`Confirming invoice payment: ${invoiceId}`);

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { booking: { include: { service: true, payments: true } } }
        });

        if (!invoice) throw new Error("Invoice not found");

        // 1. Update Invoice status to PAID
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            }
        });

        // 2. Create Payment record for tracking
        const payment = await prisma.payment.create({
            data: {
                bookingId: invoice.bookingId,
                provider: invoice.gateway || PaymentProvider.PRIMARY_PAYSTACK,
                providerRef: providerRef,
                amount: actualAmount !== undefined ? actualAmount : invoice.amount,
                currency: invoice.currency,
                status: 'PAID',
                rawPayload: payload,
            }
        });

        // 3. Update booking status to CONFIRMED
        let booking = invoice.booking;
        await this.refreshBookingPaymentStatus(invoice.bookingId);

        if (booking.status !== 'CONFIRMED') {
            booking = await prisma.booking.update({
                where: { id: invoice.bookingId },
                data: {
                    status: 'CONFIRMED',
                },
                include: { service: true, payments: true }
            });
            console.log(`Updated booking ${booking.bookingReference} to CONFIRMED`);
        }

        // 4. Create Google Calendar Event
        if (!booking.googleEventId) {
            try {
                const eventId = await createCalendarEvent(booking);
                if (eventId) {
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { googleEventId: eventId }
                    });
                }
            } catch (error) {
                console.error('Failed to create calendar event:', error);
            }
        }

        return { success: true, invoice: updatedInvoice, booking, payment };
    }

    /**
     * Recalculates and updates the payment status of a booking.
     */
    async refreshBookingPaymentStatus(bookingId: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { service: true, payments: true }
        });

        if (!booking) throw new Error("Booking not found");

        const newStatus = calculatePaymentStatus(booking);

        if (booking.paymentStatus !== newStatus) {
            await prisma.booking.update({
                where: { id: bookingId },
                data: { paymentStatus: newStatus }
            });
            console.log(`Updated booking ${booking.bookingReference} payment status to ${newStatus}`);
        }

        return newStatus;
    }

    /**
     * Initiates a refund for a specific payment via Paystack.
     */
    async initiateRefund(paymentId: string) {
        console.log(`Initiating Paystack refund for payment: ${paymentId}`);

        // 1. Fetch payment with booking details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true }
        });

        if (!payment) throw new Error("Payment not found");
        if (payment.provider !== PaymentProvider.PRIMARY_PAYSTACK && payment.provider !== PaymentProvider.SECONDARY_PAYSTACK) {
            throw new Error("Refunds are only supported for Paystack payments via this API.");
        }
        if (payment.status !== 'PAID') throw new Error("Only fully paid payments can be refunded.");

        // 2. Call Paystack Refund API
        const amountPesewas = Math.round(Number(payment.amount) * 100);
        const result = await initiatePaystackRefund(
            payment.providerRef,
            amountPesewas,
            `Refund for booking ${payment.booking.bookingReference}`,
            undefined,
            payment.provider
        );

        // 3. Log the initiation
        await prisma.paymentAuditLog.create({
            data: {
                bookingId: payment.bookingId,
                action: "REFUND_INITIATED",
                newValue: { status: "REFUND_PENDING", reference: payment.providerRef },
                metadata: { paymentId: payment.id, provider: payment.provider, paystackResponse: result }
            }
        });

        return result;
    }
}

export const paymentService = new PaymentService();
