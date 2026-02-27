import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/features/payment/server/payment.service";
import { auditLogService } from "@/features/payment/server/audit-log.service";
import { InvoiceStatus } from "@generated/prisma/client";
import { verifyWebhook } from "@/lib/hubtel";
import { inngest } from "@/lib/inngest";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // 1. Verify signature if webhook secret is configured
        const reqHeaders: Record<string, string> = {};
        req.headers.forEach((value, key) => { reqHeaders[key] = value });

        if (!verifyWebhook(reqHeaders)) {
            console.error("Invalid Hubtel webhook signature");
            return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
        }

        const { ResponseCode, responseCode, Data, data, Status, status } = payload;
        const code = ResponseCode || responseCode;
        const isSuccess = code === "0000" || Status === "Success" || status === "Successful";

        // 1. Distinguish between Payment and Refund callback
        // Payment has Data.ClientReference, Refund has data.orderId
        const isRefund = !!(data && data.orderId && !Data);

        if (isRefund) {
            console.log(`Received Hubtel Refund webhook: orderId=${data.orderId}, code=${code}`);

            // 1. Find the payment associated with this orderId
            // The orderId from Hubtel matches our providerRef (TransactionId/CheckoutId)
            const payment = await prisma.payment.findFirst({
                where: {
                    provider: 'HUBTEL',
                    providerRef: data.orderId
                },
                include: { booking: true }
            });

            if (!payment) {
                console.error(`Payment not found for Hubtel refund orderId: ${data.orderId}`);
                return NextResponse.json({ message: "Payment not found" }, { status: 404 });
            }

            // IDEMPOTENCY CHECK: If already refunded, just return OK
            if (payment.status === 'REFUNDED') {
                console.log(`Refund for orderId ${data.orderId} already processed. Skipping.`);
                return NextResponse.json({ message: "Already processed" }, { status: 200 });
            }

            // 2. Log refund callback
            await auditLogService.logAction({
                action: "REFUND_CALLBACK_RECEIVED",
                bookingId: payment.bookingId,
                metadata: { provider: "HUBTEL", body: payload },
            });

            if (code === "0000" || code === "000" || status === "Successful") {
                // SUCCESS REFUND
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'REFUNDED' }
                });

                // Use centralized refresh logic
                await paymentService.refreshBookingPaymentStatus(payment.bookingId);

                await auditLogService.logAction({
                    action: "REFUND_COMPLETED",
                    bookingId: payment.bookingId,
                    newValue: { status: "REFUNDED" },
                    metadata: { orderId: data.orderId }
                });

                console.log(`Successfully processed refund for orderId: ${data.orderId}`);
            } else {
                // FAILED REFUND
                console.warn(`Refund failed for orderId: ${data.orderId}. Code: ${code}`);
                await auditLogService.logAction({
                    action: "REFUND_FAILED",
                    bookingId: payment.bookingId,
                    metadata: { code, message: payload.message || payload.Message }
                });
            }

            return NextResponse.json({ message: "Refund callback processed" }, { status: 200 });
        }

        const reference = Data?.ClientReference;
        const transactionId = Data?.CheckoutId || Data?.TransactionId;

        if (!reference) {
            return NextResponse.json({ message: "Invalid payload: missing reference" }, { status: 400 });
        }

        console.log(`Received Hubtel payment webhook: reference=${reference}, status=${code}`);

        // 2. Find the invoice
        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber: reference },
            include: { booking: true },
        });

        if (!invoice) {
            console.error(`Invoice not found for reference: ${reference}`);
            return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
        }

        // IDEMPOTENCY CHECK: If already paid, just return OK
        if (invoice.status === InvoiceStatus.PAID) {
            console.log(`Invoice ${reference} already marked as PAID. Skipping.`);
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        // 3. Log the webhook receipt
        await auditLogService.logAction({
            action: "WEBHOOK_RECEIVED",
            invoiceId: invoice.id,
            bookingId: invoice.bookingId,
            metadata: { provider: "HUBTEL", body: payload },
        });

        // 4. Handle status update
        if (isSuccess) {
            // SUCCESS PAYMENT
            await paymentService.confirmInvoicePayment(invoice.id, transactionId || reference, payload);

            // ... (rest of the logic remains same)


            await auditLogService.logAction({
                action: "PAYMENT_COMPLETED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.PAID },
                metadata: { trans_id: transactionId },
            });

            // Notify all admins
            const amountPaid = Data.Amount ?? 0;
            await inngest.send({
                name: "app/payment.payment-received",
                data: {
                    bookingId: invoice.bookingId,
                    amountPaid: Number(amountPaid),
                    provider: "HUBTEL",
                },
            });

            console.log(`Successfully processed Hubtel payment for ${reference}`);

        } else {
            // FAILED OR PENDING PAYMENT
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: InvoiceStatus.VOID },
            });

            await auditLogService.logAction({
                action: "PAYMENT_FAILED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.VOID },
                metadata: { body: payload },
            });

            console.log(`Payment failed for Hubtel reference ${reference}. ResponseCode=${ResponseCode}`);
        }

        // Always respond quickly per Hubtel best practices
        return NextResponse.json({ message: "OK" }, { status: 200 });
    } catch (error: any) {
        console.error("Hubtel webhook error:", error);
        return NextResponse.json(
            { message: "Webhook error", error: error.message },
            { status: 500 }
        );
    }
}
