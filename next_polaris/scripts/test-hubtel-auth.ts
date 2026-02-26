import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import axios from 'axios';

const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_MERCHANT_ACCOUNT = process.env.HUBTEL_MERCHANT_ACCOUNT;

console.log('ID:', HUBTEL_CLIENT_ID);
console.log('SECRET:', HUBTEL_CLIENT_SECRET);
console.log('MERCHANT:', HUBTEL_MERCHANT_ACCOUNT);

const token = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`, 'utf8').toString('base64');
console.log('Token:', token);

async function testAuth() {
  try {
    const resp = await axios.post('https://payproxyapi.hubtel.com/items/initiate', {
        totalAmount: 1.5,
        description: 'Test Payment',
        callbackUrl: 'http://localhost:3000/api/webhooks/hubtel',
        returnUrl: 'http://localhost:3000',
        merchantAccountNumber: HUBTEL_MERCHANT_ACCOUNT,
        cancellationUrl: 'http://localhost:3000',
        clientReference: 'TEST-1234'
    }, {
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Success:', resp.data);
  } catch (error: any) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
  }
}

testAuth();
