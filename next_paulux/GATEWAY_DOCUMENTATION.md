# Payment Gateway Documentation

This document outlines the payment gateway configuration for the Paulux application. The system now uses a dual Paystack setup for redundancy and load balancing.

## Primary Paystack
- **Environment Variables**:
  - `PRIMARY_PAYSTACK_SECRET_KEY`: Private key for server-side verification.
  - `NEXT_PUBLIC_PRIMARY_PAYSTACK_PUBLIC_KEY`: Public key for client-side transactions.
- **Webhook Endpoint**: `/api/paystack-primary/webhook`
- **Provider Enum**: `PRIMARY_PAYSTACK`

## Secondary Paystack
- **Environment Variables**:
  - `SECONDARY_PAYSTACK_SECRET_KEY`: Private key for server-side verification.
  - `NEXT_PUBLIC_SECONDARY_PAYSTACK_PUBLIC_KEY`: Public key for client-side transactions.
- **Webhook Endpoint**: `/api/paystack-secondary/webhook`
- **Provider Enum**: `SECONDARY_PAYSTACK`

## Webhook Security
All webhooks implement signature verification to ensure authenticity.
- Paystack Primary uses `PRIMARY_PAYSTACK_SECRET_KEY` to verify signatures.
- Paystack Secondary uses `SECONDARY_PAYSTACK_SECRET_KEY` to verify signatures.

## Implementation Details
The `PaymentService.processSuccessfulPayment` method handles post-payment logic:
1. Updates payment status to `PAID`.
2. Confirms the booking status.
3. Synchronizes the appointment with Google Calendar.
