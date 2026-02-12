import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, amount, bookingReference, bookingId } = body;

        if (!email || !amount || !bookingReference || !bookingId) {
            return NextResponse.json(
                { message: 'Missing required fields: email, amount, bookingReference, bookingId' },
                { status: 400 }
            );
        }

        // Convert bookingReference to string if it isn't already, essential for consistency
        const reference = String(bookingReference);

        // Amount is expected in Pesewas (GHS subunit) by Paystack
        const amountPesewas = Math.round(Number(amount) * 100);

        // Construct callback URL using bookingId for better UX
        const origin = process.env.BASE_URL || req.nextUrl.origin;
        const callbackUrl = `${origin}/customer/booking/summary/${bookingId}?reference=${reference}`;

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

