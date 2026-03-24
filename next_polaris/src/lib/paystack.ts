import axios from 'axios';
import crypto from 'crypto';
import { PaymentProvider } from '@generated/prisma/client';

const PRIMARY_SECRET_KEY = process.env.PRIMARY_PAYSTACK_SECRET_KEY;
const SECONDARY_SECRET_KEY = process.env.SECONDARY_PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PRIMARY_SECRET_KEY) {
    console.warn('PRIMARY_PAYSTACK_SECRET_KEY is not defined in environment variables');
}
if (!SECONDARY_SECRET_KEY) {
    console.warn('SECONDARY_PAYSTACK_SECRET_KEY is not defined in environment variables');
}

function getSecretKey(provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK): string | undefined {
    return provider === PaymentProvider.SECONDARY_PAYSTACK ? SECONDARY_SECRET_KEY : PRIMARY_SECRET_KEY;
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

export interface PaystackRefundResponse {
    status: boolean;
    message: string;
    data: {
        transaction: {
            id: number;
            domain: string;
            reference: string;
            amount: number;
            currency: string;
            status: string;
        };
        integration: number;
        deducted_amount: number;
        channel: string | null;
        merchant_note: string;
        customer_note: string;
        status: string;
        refunded_by: string;
        expected_at: string;
        currency: string;
        domain: string;
        amount: number;
        fully_deducted: boolean;
        id: number;
        createdAt: string;
        updatedAt: string;
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
 * @param provider The Paystack account to use
 */
export async function initializeTransaction(
    email: string,
    amount: number, // in pesewas
    reference: string,
    callbackUrl?: string,
    currency: string = 'GHS',
    channels: string[] = ['card', 'mobile_money'],
    provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK
): Promise<PaystackInitializeResponse> {
    const secretKey = getSecretKey(provider);
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
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error initializing Paystack transaction (${provider}):`, error);
        throw error;
    }
}

/**
 * Initiate a refund for a Paystack transaction
 * @param transactionReference The reference of the transaction to refund
 * @param amount Optional amount to refund in pesewas (if not provided, full refund)
 * @param merchantNote Optional note for internal reference
 * @param customerNote Optional note that will be sent to the customer
 * @param provider The Paystack account to use
 */
export async function initiateRefund(
    transactionReference: string,
    amount?: number,
    merchantNote?: string,
    customerNote?: string,
    provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK
): Promise<PaystackRefundResponse> {
    const secretKey = getSecretKey(provider);
    try {
        const payload: Record<string, unknown> = {
            transaction: transactionReference,
        };

        if (amount) {
            payload.amount = amount;
        }
        if (merchantNote) {
            payload.merchant_note = merchantNote;
        }
        if (customerNote) {
            payload.customer_note = customerNote;
        }

        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/refund`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(`Error initiating Paystack refund (${provider}):`, error.response?.data || error.message);
        } else {
            console.error(`Error initiating Paystack refund (${provider}):`, error);
        }
        throw error;
    }
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string;
        reference: string;
        amount: number;
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: Record<string, unknown>;
        fees: number;
        customer: {
            id: number;
            first_name: string | null;
            last_name: string | null;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: Record<string, unknown>;
            risk_action: string;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
            account_name: string | null;
        };
    };
}

/**
 * Verify a Paystack transaction
 * @param reference The transaction reference to verify
 * @param provider The Paystack account to use
 */
export async function verifyTransaction(
    reference: string,
    provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK
): Promise<PaystackVerifyResponse> {
    const secretKey = getSecretKey(provider);
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
            }
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(`Error verifying Paystack transaction (${provider}):`, error.response?.data || error.message);
        } else {
            console.error(`Error verifying Paystack transaction (${provider}):`, error);
        }
        throw error;
    }
}


/**
 * Verify Paystack webhook signature
 * @param signature X-Paystack-Signature header
 * @param body Raw request body
 * @param provider The Paystack account to verify against
 */
export function verifyPaystackSignature(
    signature: string,
    body: unknown,
    provider: PaymentProvider = PaymentProvider.PRIMARY_PAYSTACK
): boolean {
    const secretKey = getSecretKey(provider);
    if (!secretKey) return false;

    const hash = crypto
        .createHmac('sha512', secretKey)
        .update(JSON.stringify(body))
        .digest('hex');

    return hash === signature;
}

