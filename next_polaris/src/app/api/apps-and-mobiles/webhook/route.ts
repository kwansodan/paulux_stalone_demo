import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/features/payment/server/payment.service';

/**
 * Apps & Mobiles Webhook Handler
 * 
 * TODO: Refine signature verification once full documentation or SDK is available.
 * Using provided EVENT_KEY and SIGNING_KEY_URL for configuration.
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-apps-and-mobiles-signature'); // Placeholder header name

        console.log('Received Apps & Mobiles webhook:', JSON.stringify(body, null, 2));

        // Placeholder for signature verification
        // if (!verifySignature(body, signature)) {
        //     return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        // }

        // Apps & Mobiles payload structure usually includes status, reference, etc.
        // Adjust these paths based on the actual payload format
        const { status, reference, amount, external_id } = body;

        // In some gateways, 'reference' or 'external_id' maps to our booking/payment reference
        const targetReference = reference || external_id;

        if (status === 'SUCCESS' && targetReference) {
            try {
                // Determine if this is a Paystack or Apps & Mobiles payment in DB
                // Since this is the Apps & Mobiles webhook, we expect the provider to be MANUALLY handled 
                // or we need to update the enum if we added a new provider.

                // For now, let's assume we use the same processSuccessfulPayment logic 
                // but we might need to adjust the provider check in payment.service.ts if it's hardcoded to PAYSTACK.

                const result = await paymentService.processSuccessfulPayment(targetReference, body, 'APPS_AND_MOBILES');

                if (result.success) {
                    console.log(`Payment ${targetReference} processed successfully via Apps & Mobiles webhook`);
                    return NextResponse.json({ message: 'OK' }, { status: 200 });
                } else {
                    console.error(`Payment processing failed for ${targetReference}:`, result.message);
                    return NextResponse.json({ message: result.message }, { status: 400 });
                }
            } catch (error) {
                console.error('Error processing Apps & Mobiles payment:', error);
                return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'Event ignored or missing reference' }, { status: 200 });

    } catch (error: any) {
        console.error('Apps & Mobiles webhook error:', error);
        return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }
}
