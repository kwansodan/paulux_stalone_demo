# Payment Gateway Documentation

This document outlines the payment gateway configurations for the Polaris application.

## Paystack
- **Environment Variables**:
  - `PAYSTACK_SECRET_KEY`: Private key for server-side verification.
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Public key for client-side transactions.
- **Webhook Endpoint**: `/api/paystack/webhook`
- **Provider Enum**: `PAYSTACK`

## Hubtel
- **Environment Variables**:
  - `HUBTEL_CLIENT_ID`: Hubtel API Key Client ID.
  - `HUBTEL_CLIENT_SECRET`: Hubtel API Key secret.
  - `HUBTEL_MERCHANT_ACCOUNT`: Merchant ID if required.
  - `HUBTEL_WEBHOOK_SECRET`: Optional secret header for webhook verifications (`x-hubtel-signature`).
- **Webhook Endpoint**: `/api/webhooks/hubtel`
- **Provider Enum**: `HUBTEL`

## Webhook Security
All webhooks should implement signature verification to ensure authenticity.
- Paystack uses the `x-paystack-signature` header.
- Hubtel implementation uses an optional custom `x-hubtel-signature` (mapped to `HUBTEL_WEBHOOK_SECRET`) for authenticity, or handles standard Basic Auth depending on your exact configuration. See `src/lib/hubtel.ts`.

## Implementation Details
The `PaymentService.processSuccessfulPayment` method handles post-payment logic:
1. Updates payment status to `PAID`.
2. Confirms the booking status.
3. Synchronizes the appointment with Google Calendar.
