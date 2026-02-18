import axios from 'axios';
import crypto from 'crypto';

const ORCHARD_CLIENT_ID = process.env.ORCHARD_CLIENT_ID;
const ORCHARD_API_SECRET = process.env.ORCHARD_API_SECRET;
const ORCHARD_SERVICE_ID = process.env.ORCHARD_SERVICE_ID;
const ORCHARD_BASE_URL = 'https://orchard-api.anmgw.com';

/**
 * Generates an HMAC signature for Orchard API requests.
 */
export function generateOrchardSignature(payload: any): string {
    if (!ORCHARD_API_SECRET) {
        throw new Error('ORCHARD_API_SECRET is not defined');
    }
    const message = JSON.stringify(payload);
    return crypto
        .createHmac('sha256', ORCHARD_API_SECRET)
        .update(message)
        .digest('hex');
}

export interface OrchardBalanceResponse {
    sms_bal: number;
    payout_bal: number;
    billpay_bal: number;
    available_collect_bal: number;
    airtime_bal: number;
    actual_collect_bal: number;
}

/**
 * Checks the wallet balance from Orchard API.
 */
export async function checkWalletBalance(): Promise<OrchardBalanceResponse> {
    const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
    const payload = {
        service_id: ORCHARD_SERVICE_ID,
        trans_type: "BLC",
        ts: ts
    };

    const signature = generateOrchardSignature(payload);

    try {
        const response = await axios.post(
            `${ORCHARD_BASE_URL}/check_wallet_balance`,
            payload,
            {
                headers: {
                    'Authorization': `${ORCHARD_CLIENT_ID}:${signature}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error checking Orchard wallet balance:', error.response?.data || error.message);
        throw error;
    }
}

export interface AppsAndMobilesInitializeResponse {
    status: boolean;
    message: string;
    data: {
        payment_url: string;
        reference: string;
    };
}

/**
 * Initializes an Apps & Mobiles (Orchard) transaction.
 * Note: Actual endpoint and payload may vary based on Orchard documentation.
 * This implementation assumes a standard collection flow.
 */
export async function initializeAppsAndMobilesTransaction(
    email: string,
    amount: number, // in pesewas
    reference: string,
    callbackUrl?: string,
): Promise<AppsAndMobilesInitializeResponse> {
    console.log(`Initializing Apps & Mobiles transaction: ${reference} for ${amount} pesewas`);

    const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
    const payload = {
        service_id: ORCHARD_SERVICE_ID,
        amount: (amount / 100).toFixed(2), // Convert to GHS string
        customer_email: email,
        reference: reference,
        callback_url: callbackUrl,
        ts: ts,
        // trans_type: "COL" // Typical for collections
    };

    const signature = generateOrchardSignature(payload);

    try {
        // [WARNING] The actual endpoint for initialization needs to be confirmed.
        // Usually it's /collect or /send_money depending on direction.
        const response = await axios.post(
            `${ORCHARD_BASE_URL}/collect`,
            payload,
            {
                headers: {
                    'Authorization': `${ORCHARD_CLIENT_ID}:${signature}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Map Orchard response to our internal interface
        return {
            status: response.data.resp_code === '000',
            message: response.data.resp_desc || 'Transaction initialized',
            data: {
                payment_url: response.data.payment_url || '',
                reference: reference,
            },
        };
    } catch (error: any) {
        console.error('Error initializing Orchard transaction:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Initiates a refund for an Apps & Mobiles (Orchard) transaction.
 */
export async function refundAppsAndMobilesTransaction(
    transactionReference: string,
    amount?: number, // in GHS (as stored in local DB usually)
): Promise<{ status: boolean; message: string; data: any }> {
    console.log(`Refunding Apps & Mobiles transaction: ${transactionReference} for ${amount || 'full'} amount`);

    const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
    const payload: any = {
        service_id: ORCHARD_SERVICE_ID,
        reference: transactionReference,
        ts: ts,
        // trans_type: "RFD"
    };

    if (amount) {
        payload.amount = amount.toFixed(2);
    }

    const signature = generateOrchardSignature(payload);

    try {
        const response = await axios.post(
            `${ORCHARD_BASE_URL}/refund`,
            payload,
            {
                headers: {
                    'Authorization': `${ORCHARD_CLIENT_ID}:${signature}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            status: response.data.resp_code === '000',
            message: response.data.resp_desc || 'Refund initiated',
            data: response.data,
        };
    } catch (error: any) {
        console.error('Error refunding Orchard transaction:', error.response?.data || error.message);
        throw error;
    }
}
