import { checkWalletBalance } from '../src/lib/apps-and-mobiles';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testBalance() {
    console.log('Testing Orchard Wallet Balance...');
    console.log('Using Client ID:', process.env.ORCHARD_CLIENT_ID);
    console.log('Using Service ID:', process.env.ORCHARD_SERVICE_ID);

    try {
        const balance = await checkWalletBalance();
        console.log('Balance result:', JSON.stringify(balance, null, 2));
    } catch (error: any) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testBalance();
