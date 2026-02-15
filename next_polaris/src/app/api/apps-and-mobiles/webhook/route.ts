import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';
import { auditLogService } from '@/features/payment/server/audit-log.service';
import { InvoiceStatus } from '@generated/prisma/client';

export async function POST(req: NextRequest) {
    try {
        // [PLACEHOLDER] Verify signature
        // In a real implementation, you would verify the signature from Apps & Mobiles
        const signature = req.headers.get('x-apps-and-mobiles-signature');
        if (!signature) {
            // For placeholder, we'll allow it but log a warning
            console.warn('Missing Apps & Mobiles signature (Placeholder active)');
        }

        const body = await req.json();
        const { reference, status, transaction_id } = body;

        console.log(`Received Apps & Mobiles webhook: reference=${reference}, status=${status}`);

        // 1. Find the invoice
        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber: reference },
            include: { booking: true }
        });

        if (!invoice) {
            console.error(`Invoice not found for reference: ${reference}`);
            return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
        }

        // 2 & 3. Log the webhook receipt
        await auditLogService.logAction({
            action: "WEBHOOK_RECEIVED",
            invoiceId: invoice.id,
            bookingId: invoice.bookingId,
            metadata: { provider: 'APPS_AND_MOBILES', body }
        });

        // 4. Handle status update
        if (status === 'completed' || status === 'success') {
            await paymentService.confirmInvoicePayment(invoice.id, transaction_id || reference, body);

            await auditLogService.logAction({
                action: "PAYMENT_COMPLETED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.PAID },
                metadata: { transaction_id }
            });

            console.log(`Successfully processed Apps & Mobiles payment for ${reference}`);
        } else if (status === 'failed') {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: InvoiceStatus.VOID }
            });

            await auditLogService.logAction({
                action: "PAYMENT_FAILED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.VOID },
                metadata: { body }
            });

            console.log(`Payment failed for Apps & Mobiles reference ${reference}`);
        }

        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

    } catch (error: any) {
        console.error('Apps & Mobiles webhook error:', error);
        return NextResponse.json(
            { message: 'Webhook error', error: error.message },
            { status: 500 }
        );
    }
}
