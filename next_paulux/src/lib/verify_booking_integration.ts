import dotenv from 'dotenv';
import path from 'path';

// Load env vars - MUST be done before importing files that use env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { bookingRepository } from '@/features/booking/server/booking.repository';
import { BookingStatus, PaymentStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';

// Ensure we use primary calendar for service account
process.env.GOOGLE_CALENDAR_ID = 'primary';

async function verifyBookingIntegration() {
    console.log('--- Verifying Booking Repository Integration ---');

    try {
        // 1. Create a dummy service if needed, or use existing
        const service = await prisma.service.create({
            data: {
                name: 'Test Service Integration ' + Date.now(),
                durationMinutes: 30,
                price: 50.00
            }
        });

        console.log('Created test service:', service.id);

        // 2. Create a CONFIRMED booking via repository
        console.log('Creating CONFIRMED booking...');
        const booking = await bookingRepository.upsertBooking({
            clientName: 'Integration Test Client',
            clientEmail: 'test-integ@example.com',
            clientPhone: '0555555555',
            serviceId: service.id,
            bookingDate: '2024-12-26', // Future date
            bookingTime: '14:00',
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID
        });

        console.log('Booking created:', booking.id, booking.bookingReference);

        // 3. Check if googleEventId is populated
        if (booking.googleEventId) {
            console.log('✅ Success! Booking created with Google Event ID:', booking.googleEventId);
        } else {
            console.error('❌ Failed! Google Event ID is missing on confirmed booking.');
        }

        // Cleanup
        await bookingRepository.deleteById(booking.id);
        await prisma.service.delete({ where: { id: service.id } });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

verifyBookingIntegration();
