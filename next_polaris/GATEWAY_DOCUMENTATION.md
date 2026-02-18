# Payment Gateway Documentation

This document outlines the payment gateway configurations for the Polaris application.

## Paystack
- **Environment Variables**:
  - `PAYSTACK_SECRET_KEY`: Private key for server-side verification.
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Public key for client-side transactions.
- **Webhook Endpoint**: `/api/paystack/webhook`
- **Provider Enum**: `PAYSTACK`

## Apps & Mobiles
- **Environment Variables**:
  - `APPS_AND_MOBILE_EVENT_KEY`: Provided event key for webhook identification.
  - `APPS_AND_MOBILE_SIGNING_KEY_URL`: key identifier or URL for signature verification.
- **Webhook Endpoint**: `/api/apps-and-mobiles/webhook`
- **Provider Enum**: `APPS_AND_MOBILES`

## Webhook Security
All webhooks should implement signature verification to ensure authenticity.
- Paystack uses the `x-paystack-signature` header.
- Apps & Mobiles implementation currently has a placeholder for verification; ensure to refine this once the full SDK/docs are available.

## Implementation Details
The `PaymentService.processSuccessfulPayment` method handles post-payment logic:
1. Updates payment status to `PAID`.
2. Confirms the booking status.
3. Synchronizes the appointment with Google Calendar.
