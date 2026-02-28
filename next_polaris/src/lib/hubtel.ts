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
const HUBTEL_PAY_PROXY_URL = 'https://payproxyapi.hubtel.com';
const HUBTEL_STATUS_CHECK_URL = 'https://api-txnstatus.hubtel.com';
const HUBTEL_REFUND_URL = 'https://refund-api.hubtel.com';
const HUBTEL_WEBHOOK_SECRET = process.env.HUBTEL_WEBHOOK_SECRET || ''; // optional, for verifying callbacks

if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
  throw new Error('HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET must be set in environment');
}

/**
 * Create an axios instance pre-configured with Hubtel Basic Auth and JSON headers.
 * All calls MUST be done server-side using these credentials.
 */
function createHubtelClient(baseURL: string): AxiosInstance {
  const user = HUBTEL_CLIENT_ID?.trim() || '';
  const pass = HUBTEL_CLIENT_SECRET?.trim() || '';
  const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');

  // Debug log for auth format (masked)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Hubtel] Auth header prepared for ID: ${user.substring(0, 3)}... and Secret: ${pass.substring(0, 3)}...`);
  }

  return axios.create({
    baseURL: baseURL,
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
  customerName?: string;
  customerEmail?: string;
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
  const client = createHubtelClient(HUBTEL_PAY_PROXY_URL);

  const endpoint = '/items/initiate';

  // Sanitize description: avoid special characters (&*!%@) as per Hubtel rules
  const sanitizedDescription = (params.description || `Payment for ${params.clientReference}`)
    .replace(/[&*!%@]/g, '')
    .substring(0, 100);

  const body: any = {
    totalAmount: params.amountPesewas / 100, // API expects float
    description: sanitizedDescription,
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    merchantAccountNumber: HUBTEL_MERCHANT_ACCOUNT,
    cancellationUrl: params.cancelUrl,
    clientReference: params.clientReference,
    payeeName: params.customerName,
    payeeMobileNumber: params.customerPhone,
    payeeEmail: params.customerEmail,
  };

  try {
    const resp = await client.post(endpoint, body);
    const data = resp.data || {};

    // For Pay Proxy API, usually it's in data.checkoutUrl or redirected directly, 
    // but the docs say response contains the checkout URL.
    const paylinkUrl = data.data?.checkoutUrl || data.checkoutUrl;

    if (!paylinkUrl) {
      console.warn('[Hubtel] No paylinkUrl in success response:', JSON.stringify(data));
      return {
        success: false,
        raw: data,
        message: 'No paylink returned by Hubtel. ResponseCode: ' + (data.responseCode || data.ResponseCode),
      };
    }

    return { success: true, paylinkUrl, raw: data };
  } catch (err: any) {
    const errorData = err.response?.data;
    const statusCode = err.response?.status;

    console.error(`[Hubtel] initializeOnlineCheckout error (Status: ${statusCode}):`, {
      message: err.message,
      hubtelResponse: errorData,
      endpoint: HUBTEL_PAY_PROXY_URL + endpoint
    });

    return {
      success: false,
      raw: errorData || err.message,
      message: statusCode === 401
        ? 'Hubtel authentication failed (401). Please check your CLIENT_ID and CLIENT_SECRET.'
        : 'Failed to initialize Hubtel checkout',
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
export async function getTransactionStatus(clientReference: string): Promise<TransactionStatusResult> {
  const client = createHubtelClient(HUBTEL_STATUS_CHECK_URL);

  const endpoint = `/transactions/${HUBTEL_MERCHANT_ACCOUNT}/status?clientReference=${encodeURIComponent(clientReference)}`;

  try {
    const resp = await client.get(endpoint);
    const data = resp.data || {};

    const isPaid = data.data?.status === 'Paid' || data.data?.status === 'Success';

    return {
      success: true,
      status: data.data?.status || (data.responseCode === '0000' ? 'Success' : 'Failed'),
      amount: data.data?.amount,
      transactionId: data.data?.transactionId,
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
/**
 * refundTransaction
 *
 * Initiates a refund for a transaction. 
 * Hubtel requires:
 * - Hubtel_POS_Sales_ID (in URL)
 * - orderId (from the original payment callback, in URL)
 * - callbackUrl (to receive final refund notification)
 */
export async function refundTransaction(orderId: string, callbackUrl: string): Promise<RefundResult> {
  const client = createHubtelClient(HUBTEL_REFUND_URL);

  const endpoint = `/refund/${HUBTEL_MERCHANT_ACCOUNT}/order/${orderId}`;

  const body = {
    callbackUrl,
  };

  try {
    const resp = await client.post(endpoint, body);
    const data = resp.data || {};

    // ResponseCode 0001 means pending/accepted.
    const success = data.responseCode === '0001' || data.ResponseCode === '0001';

    return {
      success,
      raw: data,
      message: data.message || data.Message || (success ? 'Refund request accepted' : 'Refund request failed')
    };
  } catch (err: any) {
    console.error('Hubtel refundTransaction error:', err.response?.data || err.message || err);
    return { success: false, raw: err.response?.data || err.message, message: 'Refund API call failed' };
  }
}