import axios from 'axios';

async function testMetrics() {
    console.log('Testing Gateway Metrics API...');
    const baseUrl = 'http://localhost:3000'; // Assuming local dev

    try {
        console.log('\n1. Fetching current metrics...');
        const getResponse = await axios.get(`${baseUrl}/api/payments/gateway-metrics`);
        console.log('Metrics:', JSON.stringify(getResponse.data, null, 2));

        console.log('\n2. Updating routing threshold to 50%...');
        const patchResponse = await axios.patch(`${baseUrl}/api/payments/gateway-metrics`, {
            paystackPercentage: 50
        });
        console.log('Patch Result:', patchResponse.data);

        console.log('\n3. Verifying update...');
        const verifyResponse = await axios.get(`${baseUrl}/api/payments/gateway-metrics`);
        console.log('New Threshold:', verifyResponse.data.routingThreshold);

    } catch (error: any) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testMetrics();
