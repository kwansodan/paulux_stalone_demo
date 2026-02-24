import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { truncate } from "node:fs/promises";
import { calculatePaymentStatus } from "../utils/helpers";

export class PaymentService {
    /**
     * Process a successful payment from Paystack.
     * Updates payment status, confirms booking, and syncs to Google Calendar.
     * idempotent: Safe to call multiple times for the same reference.
     */
    async processSuccessfulPayment(reference: string, data: any, provider: 'PAYSTACK' | 'HUBTEL' = 'PAYSTACK') {
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
        // We fetch the booking again or use the included one, but we need to update it
        let booking = payment.booking;
        const bookingPaymentStatus = calculatePaymentStatus(booking)
        if (booking.status !== 'CONFIRMED' || bookingPaymentStatus !== 'PAID') {
            booking = await prisma.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
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

    async confirmInvoicePayment(invoiceId: string, providerRef: string, payload: any) {
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
                provider: invoice.gateway || 'PAYSTACK', // Fallback to PAYSTACK if not set
                providerRef: providerRef,
                amount: invoice.amount,
                currency: invoice.currency,
                status: 'PAID',
                rawPayload: payload,
            }
        });

        // 3. Update booking status to CONFIRMED
        let booking = invoice.booking;

        // Sum total amount paid
        const allInvoices = await prisma.invoice.findMany({
            where: {
                bookingId: invoice.bookingId,
                status: 'PAID'
            }
        });
        const totalPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

        const isFullyPaid = totalPaid >= Number(booking.service.price);
        const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIAL';

        if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== newPaymentStatus) {
            booking = await prisma.booking.update({
                where: { id: invoice.bookingId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: newPaymentStatus,
                },
                include: { service: true, payments: true }
            });
            console.log(`Updated booking ${booking.bookingReference} to CONFIRMED with payment status ${newPaymentStatus}`);
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
     * Initiates a refund for a specific payment via Hubtel.
     */
    async initiateRefund(paymentId: string, callbackUrl: string) {
        console.log(`Initiating refund for payment: ${paymentId}`);

        // 1. Fetch payment with booking details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true }
        });

        if (!payment) throw new Error("Payment not found");
        if (payment.provider !== 'HUBTEL') throw new Error("Refunds are only supported for Hubtel payments via this API.");
        if (payment.status !== 'PAID') throw new Error("Only fully paid payments can be refunded.");

        // 2. SAFEGUARD: Check 45-day limit
        const now = new Date();
        const paymentDate = new Date(payment.createdAt);
        const diffInDays = (now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24);

        if (diffInDays > 45) {
            throw new Error("Refunds via API are only supported for transactions made within the last 45 days. Please contact Hubtel support for older transactions.");
        }

        // 3. SAFEGUARD: Check if amount is >= 1 GHS (Hubtel requirement)
        if (Number(payment.amount) < 1) {
            throw new Error("Refund cannot be processed - order amount is less than 1 GHS.");
        }

        // 4. Retrieve Hubtel Order ID
        // In Hubtel payment callbacks, Data.TransactionId or Data.CheckoutId usually acts as the orderId.
        // We store the webhook payload in rawPayload.success_processing.data
        const rawData = (payment.rawPayload as any)?.success_processing?.data;
        const orderId = rawData?.Data?.CheckoutId || rawData?.Data?.TransactionId || payment.providerRef;

        if (!orderId) throw new Error("Hubtel Order ID (transaction ID) not found for this payment.");

        // 5. Call Hubtel Refund API
        const { refundTransaction } = await import("@/lib/hubtel");
        const result = await refundTransaction(orderId, callbackUrl);

        // 6. Log the initiation
        await prisma.paymentAuditLog.create({
            data: {
                bookingId: payment.bookingId,
                action: "REFUND_INITIATED",
                newValue: { status: "REFUND_PENDING", orderId },
                metadata: { paymentId: payment.id, hubtelResponse: result.raw }
            }
        });

        return result;
    }
}

export const paymentService = new PaymentService();
