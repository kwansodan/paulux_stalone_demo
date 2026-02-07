import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Environment variables
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

// Initialize JWT client
const auth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Create a Google Calendar event from a booking
 */
export async function createCalendarEvent(booking: any) {
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
        console.warn('Google Calendar credentials not found. Skipping event creation.');
        return null;
    }

    // Format date-time for Google API (RFC3339)
    // Assuming booking has date (YYYY-MM-DD) and time (HH:MM or HH:MM:SS)

    // Need to combine date and time. 
    // Note: Polaris schema checks: bookingDate (String), bookingTime (String)
    // Example: 2024-05-20, 14:00

    const startDateTimeStr = `${booking.bookingDate}T${booking.bookingTime}:00`;
    const startDate = new Date(startDateTimeStr);

    // Calculate end time usually based on service duration, but here we might default to 1 hour if not provided
    // We'll assume 1 hour availability/service duration for now or fetch service duration
    const durationMinutes = booking.service?.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const event = {
        summary: `Booking: ${booking.clientName} - ${booking.service?.name || 'Service'}`,
        description: `
      Service: ${booking.service?.name || 'N/A'}
      Client: ${booking.clientName}
      Phone: ${booking.clientPhone}
      Email: ${booking.clientEmail}
      Ref: ${booking.bookingReference}
    `.trim(),
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Africa/Accra', // Default to Ghana time per context
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Africa/Accra',
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
        });

        console.log('Event created on Google Calendar:', response.data.htmlLink);
        return response.data.id;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        // Don't throw, just log, so we don't block the main flow
        return null;
    }
}

/**
 * Update logic can be added later if needed
 */
