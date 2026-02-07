import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_paystack_secret_key';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOCAL_URL = `${BASE_URL}/api/paystack/webhook`;

const payload = {
    event: 'charge.success',
    data: {
        reference: 'TEST-REF-123',
        status: 'success',
        amount: 20000,
        currency: 'GHS',
    },
};

const body = JSON.stringify(payload);
const signature = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

console.log('--- Verifying Paystack Webhook ---');
console.log('Target URL:', LOCAL_URL);
console.log('Secret (masked):', PAYSTACK_SECRET_KEY.slice(0, 5) + '...');
console.log('Signature:', signature);

// Since we are not running the server, this script is just a demonstration of how validation WOULD work
// or we can use it to test against a running local server.
// For this environment, I will just output the curl command that the user can run.

console.log('\nTo verify, ensure your Next.js server is running (npm run dev) and run this curl command:');
console.log(`
curl -X POST ${LOCAL_URL} \\
  -H "Content-Type: application/json" \\
  -H "x-paystack-signature: ${signature}" \\
  -d '${body}'
`);
