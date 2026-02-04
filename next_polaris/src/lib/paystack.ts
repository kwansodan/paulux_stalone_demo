import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
    console.warn('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

/**
 * Initialize a Paystack transaction
 * @param email Customer email
 * @param amount Amount in pesewas (or lowest currency unit)
 * @param reference Unique transaction reference
 * @param callbackUrl URL to redirect to after payment
 * @param currency Currency code (default: GHS)
 * @param channels Payment channels to enable (e.g., ['card', 'mobile_money'])
 */
export async function initializeTransaction(
    email: string,
    amount: number, // in pesewas
    reference: string,
    callbackUrl?: string,
    currency: string = 'GHS',
    channels: string[] = ['card', 'mobile_money']
): Promise<PaystackInitializeResponse> {
    try {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email,
                amount: amount.toString(),
                reference,
                callback_url: callbackUrl,
                currency,
                channels,
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error initializing Paystack transaction:', error);
        throw error;
    }
}

/**
 * Verify Paystack webhook signature
 * @param signature X-Paystack-Signature header
 * @param body Raw request body
 */
export function verifyPaystackSignature(
    signature: string,
    body: any
): boolean {
    if (!PAYSTACK_SECRET_KEY) return false;

    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');

    return hash === signature;
}
