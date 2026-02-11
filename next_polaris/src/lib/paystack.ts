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
 * Initiate a refund for a Paystack transaction
 * @param transactionReference The reference of the transaction to refund
 * @param amount Optional amount to refund in pesewas (if not provided, full refund)
 * @param merchantNote Optional note for internal reference
 * @param customerNote Optional note that will be sent to the customer
 */
export async function initiateRefund(
    transactionReference: string,
    amount?: number,
    merchantNote?: string,
    customerNote?: string
): Promise<PaystackRefundResponse> {
    try {
        const payload: any = {
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
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Error initiating Paystack refund:', error.response?.data || error.message);
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
        metadata: any;
        fees: number;
        customer: {
            id: number;
            first_name: string | null;
            last_name: string | null;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: any;
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
 */
export async function verifyTransaction(
    reference: string
): Promise<PaystackVerifyResponse> {
    try {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Error verifying Paystack transaction:', error.response?.data || error.message);
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

