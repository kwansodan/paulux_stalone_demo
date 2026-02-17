# Payment Gateway Integration Documentation

This document provides a summary of the payment gateway implementations (Paystack and Apps & Mobiles/Orchard), detailed API endpoint documentation, and instructions for frontend integration.

## 1. Implementation Summary

### Paystack
- **Core Logic**: [paystack.ts](file:///home/joojo/Desktop/polaris/next_polaris/src/lib/paystack.ts)
- **Features**: REST-based integration with HMAC signature verification for webhooks.
- **Failover Role**: Primary gateway for Card and Mobile Money.

### Apps & Mobiles (Orchard)
- **Core Logic**: [apps-and-mobiles.ts](file:///home/joojo/Desktop/polaris/next_polaris/src/lib/apps-and-mobiles.ts)
- **Features**: HMAC-SHA256 authenticated requests (Authorization: CLIENT_ID:SIGNATURE).
- **Failover Role**: Secondary gateway for Mobile Money.

### Unified Processing
- **Service**: [payment-processing.service.ts](file:///home/joojo/Desktop/polaris/next_polaris/src/features/payment/server/payment-processing.service.ts)
- **Logic**: Automatically selects the best gateway based on current daily allocation (%) and health. Handles automatic failover if the primary gateway fails to initialize.

---

## 2. API Endpoints

### Unified Payment Initialization
**Endpoint**: `POST /api/payments/initialize`

| Field | Type | Description |
| :--- | :--- | :--- |
| `bookingId` | String | (Required) UUID of the booking. |
| `email` | String | (Required) Customer email. |
| `amount` | Number | (Required) Amount in GHS (e.g., 50.00). |
| `bookingReference` | String | (Required) Unique reference for the booking. |
| `callbackUrl` | String | (Optional) URL to redirect to after payment. |
| `transactionType` | String | (Optional) "initial", "top_up", or "refund". |

**Response**:
```json
{
  "success": true,
  "paymentUrl": "https://...",
  "gateway": "PAYSTACK",
  "invoiceNumber": "INV-123456789"
}
```

### Gateway Metrics & Monitoring
**Endpoint**: `GET /api/payments/gateway-metrics`

**Response**:
```json
{
  "paystack": {
    "totalAmount": 1500.50,
    "percentage": 60.5,
    "lastWebhookAt": "2024-03-20T10:30:00.000Z"
  },
  "appsAndMobiles": {
    "totalAmount": 980.20,
    "percentage": 39.5,
    "lastWebhookAt": "2024-03-20T10:15:00.000Z"
  },
  "totalAmount": 2480.70,
  "routingThreshold": 40
}
```

### Update Routing Distribution
**Endpoint**: `PATCH /api/payments/gateway-metrics`

| Field | Type | Description |
| :--- | :--- | :--- |
| `paystackPercentage` | Number | (Required) Target % for Paystack (0-100). Apps & Mobiles will take the remainder. |

---

## 3. Frontend Integration Guide

### Initializing a Payment
When a user confirms a booking, call the unified initialization endpoint. This ensures the correct gateway is selected automatically based on your admin settings.

```javascript
const response = await fetch('/api/payments/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: 'uuid',
    email: 'customer@example.com',
    amount: 150.00,
    bookingReference: 'POL-REF-123',
    callbackUrl: window.location.origin + '/payment/success'
  })
});

const { paymentUrl } = await response.json();
if (paymentUrl) window.location.href = paymentUrl; // Redirect to checkout
```

### Displaying Gateway Status (Admin Dash)
Use the metrics endpoint to build a "Gateway Health" or "Distribution" widget.

```javascript
const fetchMetrics = async () => {
  const res = await fetch('/api/payments/gateway-metrics');
  const data = await res.json();
  
  console.log(`Paystack Total: GHS ${data.paystack.totalAmount}`);
  console.log(`Apps & Mobiles Total: GHS ${data.appsAndMobiles.totalAmount}`);
  console.log(`Last Webhook: ${data.paystack.lastWebhookAt || 'Never'}`);
};
```

### Controlling Distribution
Provide a slider or input in the Admin Settings to adjust `routingThreshold`.

```javascript
const updateThreshold = async (percent) => {
  await fetch('/api/payments/gateway-metrics', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paystackPercentage: percent })
  });
};
```

---

## 4. Webhook Configuration
Configure the following URLs in your gateway dashboards:

- **Paystack Webhook**: `https://your-domain.com/api/paystack/webhook`
- **Orchard Webhook**: `https://your-domain.com/api/apps-and-mobiles/webhook`
