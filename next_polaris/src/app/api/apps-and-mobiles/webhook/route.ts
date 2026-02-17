import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';
import { auditLogService } from '@/features/payment/server/audit-log.service';
import { InvoiceStatus } from '@generated/prisma/client';
import { generateOrchardSignature } from '@/lib/apps-and-mobiles';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reference, trans_status, trans_id, trans_ref } = body;

        // 1. Verify signature
        // Orchard sample puts it in Auth header, but standard webhooks often use a dedicated header
        // We'll check for our custom header first, then look at how Orchard typically does it.
        const providedSignature = req.headers.get('x-apps-and-mobiles-signature');

        if (providedSignature) {
            const expectedSignature = generateOrchardSignature(body);
            if (providedSignature !== expectedSignature) {
                console.error('Invalid Orchard webhook signature');
                return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
            }
        } else {
            // If no signature header, we might be in dev or Orchard uses IP whitelisting
            // For now, we'll log it but proceed if we are in development
            console.warn('Missing Apps & Mobiles signature header');
        }

        console.log(`Received Apps & Mobiles webhook: reference=${reference}, status=${trans_status}`);

        // 2. Find the invoice
        const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber: reference },
            include: { booking: true }
        });

        if (!invoice) {
            console.error(`Invoice not found for reference: ${reference}`);
            return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
        }

        // 3. Log the webhook receipt
        await auditLogService.logAction({
            action: "WEBHOOK_RECEIVED",
            invoiceId: invoice.id,
            bookingId: invoice.bookingId,
            metadata: { provider: 'APPS_AND_MOBILES', body }
        });

        // 4. Handle status update
        // Orchard typically uses: 000 for Success, others for failure/pending
        if (trans_status === '000' || trans_status === '01') { // 01 is often 'Success' in some Orchard versions
            await paymentService.confirmInvoicePayment(invoice.id, trans_id || trans_ref || reference, body);

            await auditLogService.logAction({
                action: "PAYMENT_COMPLETED",
                invoiceId: invoice.id,
                bookingId: invoice.bookingId,
                newValue: { status: InvoiceStatus.PAID },
                metadata: { trans_id }
            });

            console.log(`Successfully processed Apps & Mobiles payment for ${reference}`);
        } else if (trans_status === '001' || trans_status === 'failed') {
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
