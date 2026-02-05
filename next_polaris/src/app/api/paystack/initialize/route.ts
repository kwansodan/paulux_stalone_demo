import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, amount, bookingReference } = body;

        if (!email || !amount || !bookingReference) {
            return NextResponse.json(
                { message: 'Missing required fields: email, amount, bookingReference' },
                { status: 400 }
            );
        }

        // Convert bookingReference to string if it isn't already, essential for consistency
        const reference = String(bookingReference);

        // Amount is expected in Pesewas (GHS subunit) by Paystack
        const amountPesewas = Math.round(Number(amount) * 100);

        // Construct callback URL (optional, can be omitted if relying on webhook)
        // Using origin from request if available, or env var
        const origin = req.nextUrl.origin;
        const callbackUrl = `${origin}/booking/confirmation?reference=${reference}`;

        const paystackResponse = await initializeTransaction(
            email,
            amountPesewas,
            reference,
            callbackUrl,
            'GHS', // Currency
            ['card', 'mobile_money'] // Channels (Mobile Money covers MTN, Telecel, etc.)
        );

        return NextResponse.json(paystackResponse);
    } catch (error: any) {
        console.error('Paystack initialization error:', error);
        return NextResponse.json(
            { message: 'Failed to initialize payment', error: error.message },
            { status: 500 }
        );
    }
}
