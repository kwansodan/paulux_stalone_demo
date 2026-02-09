import dotenv from 'dotenv';
import path from 'path';
import { createCalendarEvent } from './google-calendar';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testCalendar() {
    console.log('--- Testing Google Calendar Integration ---');

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.error('Error: Google credentials not found in env.');
        return;
    }

    // Mock booking object
    const mockBooking = {
        bookingReference: 'TEST-CAL-' + Date.now(),
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        clientPhone: '0500000000',
        bookingDate: '2024-12-25',
        bookingTime: '10:00',
        service: {
            name: 'Test Service (Haircut)',
            durationMinutes: 60
        }
    };

    console.log(`Creating event for: ${mockBooking.clientName} on ${mockBooking.bookingDate} at ${mockBooking.bookingTime}`);

    try {
        const eventId = await createCalendarEvent(mockBooking);
        if (eventId) {
            console.log('✅ Success! Event created with ID:', eventId);
            console.log('Check your Google Calendar to verify.');
        } else {
            console.log('❌ Failed to create event (check logs above).');
        }
    } catch (error) {
        console.error('❌ Error testing calendar:', error);
    }
}

testCalendar();
