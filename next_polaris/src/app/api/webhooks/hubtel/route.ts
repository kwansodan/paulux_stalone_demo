import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/features/payment/server/payment.service";
import { auditLogService } from "@/features/payment/server/audit-log.service";
import { InvoiceStatus } from "@generated/prisma/client";
import { verifyWebhook } from "@/lib/hubtel";

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

        const { ResponseCode, Data } = payload;

        if (!Data) {
            return NextResponse.json({ message: "Invalid payload format" }, { status: 400 });
        }

        const reference = Data.ClientReference;
        const transactionId = Data.TransactionId;

        console.log(`Received Hubtel webhook: reference=${reference}, status=${ResponseCode}`);

        // 2. Find the invoice
        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber: reference },
            include: { booking: true },
        });

        if (!invoice) {
            console.error(`Invoice not found for reference: ${reference}`);
            return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
        }

        // 3. Log the webhook receipt
        await auditLogService.logAction({
            action: "WEBHOOK_RECEIVED",
            invoiceId: invoice.id,
            bookingId: invoice.bookingId,
            metadata: { provider: "HUBTEL", body: payload },
        });

        // 4. Handle status update based on ResponseCode
        if (ResponseCode === "0000") {
            // SUCCESS PAYMENT
            await paymentService.confirmInvoicePayment(invoice.id, transactionId || reference, payload);

            await auditLogService.logAction({
                action: "PAYMENT_COMPLETED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.PAID },
                metadata: { trans_id: transactionId },
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
