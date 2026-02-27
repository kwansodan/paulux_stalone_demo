import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from the root of next_polaris
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { initializeOnlineCheckout } from '../src/lib/hubtel';

async function testHubtel() {
    console.log('--- Hubtel Credential Test ---');
    console.log('HUBTEL_CLIENT_ID:', process.env.HUBTEL_CLIENT_ID ? 'Exists (starts with ' + process.env.HUBTEL_CLIENT_ID.substring(0, 3) + '...)' : 'MISSING');
    console.log('HUBTEL_CLIENT_SECRET:', process.env.HUBTEL_CLIENT_SECRET ? 'Exists' : 'MISSING');
    console.log('HUBTEL_MERCHANT_ACCOUNT:', process.env.HUBTEL_MERCHANT_ACCOUNT || 'MISSING');
    console.log('------------------------------');

    try {
        const result = await initializeOnlineCheckout({
            amountPesewas: 100, // 1 GHS
            clientReference: 'TEST-' + Date.now(),
            callbackUrl: 'https://example.com/callback',
            description: 'Hubtel Credential Test'
        });

        if (result.success) {
            console.log('✅ SUCCESS! Hubtel initialized correctly.');
            console.log('Paylink URL:', result.paylinkUrl);
        } else {
            console.error('❌ FAILED:');
            console.error('Message:', result.message);
            console.error('Raw Response:', JSON.stringify(result.raw, null, 2));
        }
    } catch (error: any) {
        console.error('🔥 CRITICAL ERROR:', error.message);
    }
}

testHubtel();
