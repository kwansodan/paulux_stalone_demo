// hubtel.service.ts
// Hubtel integration helpers for a Node (TypeScript) backend.
//
// Key points:
// - Hubtel uses HTTP Basic Auth (ClientID:ClientSecret) on server-to-server requests.
// - Use the Online Checkout (paylink/redirect) flow for booking payments.
// - Never call Hubtel endpoints directly from the frontend.
// - Always verify webhook callbacks and implement idempotency in your DB.
//
// Sources: Hubtel developer docs and Online Checkout guide (see chat reply citations).

import axios, { AxiosInstance } from 'axios';

/**
 * Environment variables (required):
 * - HUBTEL_CLIENT_ID:    your Hubtel API client id (username for Basic Auth)
 * - HUBTEL_CLIENT_SECRET: your Hubtel API client secret (password for Basic Auth)
 * - HUBTEL_MERCHANT_ACCOUNT: (optional) merchant/account identifier required by some Hubtel endpoints
 * - HUBTEL_WEBHOOK_SECRET: (optional) an app-side secret you expect on webhook requests (recommended)
 */
const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_MERCHANT_ACCOUNT = process.env.HUBTEL_MERCHANT_ACCOUNT || '';
const HUBTEL_BASE_URL = process.env.HUBTEL_BASE_URL || 'https://api.hubtel.com';
const HUBTEL_WEBHOOK_SECRET = process.env.HUBTEL_WEBHOOK_SECRET || ''; // optional, for verifying callbacks

if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
  throw new Error('HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET must be set in environment');
}

/**
 * Create an axios instance pre-configured with Hubtel Basic Auth and JSON headers.
 * All calls MUST be done server-side using these credentials.
 */
function createHubtelClient(): AxiosInstance {
  const token = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`, 'utf8').toString('base64');
  return axios.create({
    baseURL: HUBTEL_BASE_URL,
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 15000,
  });
}

/* -----------------------------
   Types
   ----------------------------- */

export interface OnlineCheckoutInitParams {
  amountPesewas: number; // amount in pesewas (like your Orchard code), integer
  clientReference: string; // your internal booking reference (must be unique)
  description?: string;
  callbackUrl: string; // where Hubtel will POST payment result
  returnUrl?: string; // where the user returns after paying (optional)
  cancelUrl?: string; // cancellation redirect (optional)
  customerPhone?: string; // optional, helpful for mobile-money flows
}

export interface OnlineCheckoutInitResult {
  success: boolean;
  paylinkUrl?: string;
  raw?: any;
  message?: string;
}

/**
 * Refund result wrapper
 */
export interface RefundResult {
  success: boolean;
  raw?: any;
  message?: string;
}

/**
 * Transaction status wrapper (what you should rely on for reconciliation)
 */
export interface TransactionStatusResult {
  success: boolean;
  status?: string;
  amount?: number;
  transactionId?: string;
  raw?: any;
}

/* -----------------------------
   Helpers
   ----------------------------- */

/**
 * convert pesewas -> GHS decimal string expected by Hubtel's checkout payload.
 * Eg: 15000 pesewas -> "150.00"
 */
function pesewasToGhsString(pesewas: number): string {
  return (pesewas / 100).toFixed(2);
}

/**
 * Optional: verify webhook authenticity.
 * Hubtel's official docs instruct using Basic Auth for API calls; webhook signing details
 * may vary by account and integration — if Hubtel provides a signature header in your dashboard,
 * prefer verifying that instead. As a minimal additional check you can:
 * - Require a shared HUBTEL_WEBHOOK_SECRET header (X-Hubtel-Signature or custom header)
 * - Verify source IPs if Hubtel publishes them
 *
 * This function demonstrates checking a simple shared-secret header "x-hubtel-signature".
 * If you don't use a shared secret, remove this check and replace with your preferred verification.
 */
export function verifyWebhook(reqHeaders: Record<string, string | string[] | undefined>): boolean {
  if (!HUBTEL_WEBHOOK_SECRET) {
    // No webhook secret configured — caller must implement alternate verification.
    return true;
  }
  const sig = (reqHeaders['x-hubtel-signature'] as string) || (reqHeaders['x-hubtel-signature'.toLowerCase()] as string);
  if (!sig) return false;
  // Constant-time compare would be better in production; this is a simple equality check.
  return sig === HUBTEL_WEBHOOK_SECRET;
}

/* -----------------------------
   Core API functions
   ----------------------------- */

/**
 * initializeOnlineCheckout
 *
 * Creates a Hubtel "Online Checkout" / paylink request and returns the URL the frontend should redirect to.
 *
 * Implementation notes:
 * - Hubtel expects amount as decimal (GHS), so we convert pesewas -> "150.00".
 * - We include clientReference (your booking id) so the webhook can map the payment to the booking.
 * - Always store the generated clientReference and the request attempt in your DB BEFORE redirecting the user.
 * - Do not call this from client-side code because it uses Basic Auth credentials.
 */
export async function initializeOnlineCheckout(params: OnlineCheckoutInitParams): Promise<OnlineCheckoutInitResult> {
  const client = createHubtelClient();

  // Endpoint path – Hubtel Online Checkout endpoint. Double-check with your account docs.
  // Some accounts may use /v1/... or /v2/... variants. If in doubt, consult Hubtel dev portal.
  const endpoint = '/v2/merchantaccount/onlinecheckout/request';

  const body: any = {
    amount: pesewasToGhsString(params.amountPesewas),
    title: params.description || 'Booking payment',
    description: params.description || `Payment for ${params.clientReference}`,
    clientReference: params.clientReference,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    cancellationUrl: params.cancelUrl,
    // optional: customer phone if you have it
    customerPhoneNumber: params.customerPhone,
    // some Hubtel accounts require merchantAccount or service parameters
    merchantAccount: HUBTEL_MERCHANT_ACCOUNT || undefined,
  };

  try {
    const resp = await client.post(endpoint, body);
    // Typical Hubtel response contains a paylink url (field name can vary by API version).
    const data = resp.data || {};
    // try a few common properties where paylink might live
    const paylinkUrl = data.paylinkUrl || data.payment_url || data.checkout_url || data.data?.paylinkUrl;

    if (!paylinkUrl) {
      return {
        success: false,
        raw: data,
        message: 'No paylink returned by Hubtel (check endpoint and payload fields)',
      };
    }

    return { success: true, paylinkUrl, raw: data };
  } catch (err: any) {
    // Log the whole error for server-side debugging (do not leak secrets to client)
    console.error('Hubtel initializeOnlineCheckout error:', err.response?.data || err.message || err);
    return {
      success: false,
      raw: err.response?.data || err.message,
      message: 'Failed to initialize Hubtel checkout',
    };
  }
}

/**
 * getTransactionStatus
 *
 * Query Hubtel for the status of a transaction using a reference or transaction id.
 * Implement this as a fallback/check after webhook notification, or for admin lookups.
 *
 * Note: endpoint paths vary by Hubtel API (transactions endpoints often live under /v1/transactions or a /v2/transactions).
 * Confirm the exact path for your merchant account in Hubtel developer portal and replace below if necessary.
 */
export async function getTransactionStatus(clientReferenceOrTransactionId: string): Promise<TransactionStatusResult> {
  const client = createHubtelClient();

  // Example endpoint — replace with the correct one for your Hubtel account if different.
  const endpoint = `/v1/transactions/${encodeURIComponent(clientReferenceOrTransactionId)}`;

  try {
    const resp = await client.get(endpoint);
    const data = resp.data || {};

    // Map Hubtel response into our shape. Adjust as needed to match the actual response fields.
    return {
      success: true,
      status: data.status || data.Data?.status || data.paymentStatus,
      amount: data.amount || data.Data?.Amount,
      transactionId: data.transactionId || data.Data?.TransactionId || data.OrderId,
      raw: data,
    };
  } catch (err: any) {
    console.error('Hubtel getTransactionStatus error:', err.response?.data || err.message || err);
    return { success: false, raw: err.response?.data || err.message };
  }
}

/**
 * refundTransaction
 *
 * Initiates a refund for a transaction. Hubtel supports reversals/refunds via API, but exact endpoint and payload
 * depend on your account and the API version. Verify with Hubtel docs and your merchant settings.
 */
export async function refundTransaction(transactionId: string, amountGhs?: number): Promise<RefundResult> {
  const client = createHubtelClient();

  // Example refund endpoint placeholder – confirm the correct path with Hubtel.
  const endpoint = '/v1/transactions/refund';

  const body: any = {
    transactionId,
  };

  if (typeof amountGhs === 'number') {
    // Hubtel usually expects decimal GHS amount
    body.amount = amountGhs.toFixed(2);
  }

  try {
    const resp = await client.post(endpoint, body);
    const data = resp.data || {};
    const success = data.ResponseCode === '000' || data.responseCode === '000' || data.ResponseCode === '0000';
    return { success, raw: data, message: data.ResponseMessage || data.responseMessage || data.resp_desc };
  } catch (err: any) {
    console.error('Hubtel refundTransaction error:', err.response?.data || err.message || err);
    return { success: false, raw: err.response?.data || err.message, message: 'Refund API call failed' };
  }
}