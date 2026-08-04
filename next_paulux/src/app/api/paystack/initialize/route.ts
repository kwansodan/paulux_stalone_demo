import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';
import { PaymentProvider } from '@generated/prisma/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, amount, bookingReference, bookingId, provider } = body;

        if (!email || !amount || !bookingReference || !bookingId) {
            return NextResponse.json(
                { message: 'Missing required fields: email, amount, bookingReference, bookingId' },
                { status: 400 }
            );
        }

        // Convert bookingReference to string if it isn't already
        const reference = String(bookingReference);

        // Amount is expected in Pesewas (GHS subunit) by Paystack
        const amountPesewas = Math.round(Number(amount) * 100);

        // Construct callback URL
        const origin = process.env.BASE_URL || req.nextUrl.origin;
        const callbackUrl = `${origin}/customer/booking/summary/${bookingId}?reference=${reference}`;

        // Default to PRIMARY_PAYSTACK if not provided
        const selectedProvider = provider || PaymentProvider.PRIMARY_PAYSTACK;

        const paystackResponse = await initializeTransaction(
            email,
            amountPesewas,
            reference,
            callbackUrl,
            'GHS', // Currency
            ['mobile_money'],
            selectedProvider
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

