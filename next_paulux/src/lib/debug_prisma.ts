import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { prisma } from '@/lib/prisma';
import { generateBookingReference } from '@/utils/helpers';
import { BookingStatus, PaymentStatus } from '@generated/prisma/client';
import { createCalendarEvent } from '@/lib/google-calendar';

async function debugPrisma() {
    console.log('--- Debugging Prisma Adapter ---');
    try {
        console.log('1. Creating Dummy Service...');
        const service = await prisma.service.create({
            data: {
                name: 'Debug Service ' + Date.now(),
                durationMinutes: 15,
                price: 10.00
            }
        });

        console.log('2. Creating Booking...');
        const booking = await prisma.booking.create({
            data: {
                bookingReference: generateBookingReference(),
                clientName: 'Debug Client',
                clientEmail: 'debug@example.com',
                clientPhone: '0000000000',
                services: {
                    create: [{
                        serviceId: service.id,
                        durationAtBooking: service.durationMinutes,
                        priceAtBooking: service.price
                    }]
                },
                bookingDate: '2025-01-01',
                bookingTime: '00:00',
                status: BookingStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING
            },
            include: { services: { include: { service: true } } }
        });
        console.log('Booking created:', booking.id);

        // Load env vars MUST be before import for this test too, though we did it at top
        // import { createCalendarEvent } from '@/lib/google-calendar';

        console.log('3. Calling createCalendarEvent...');
        // Mock booking object for calendar
        const mockBooking = {
            id: booking.id,
            bookingReference: booking.bookingReference,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            clientPhone: booking.clientPhone,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            service: {
                name: service.name,
                durationMinutes: service.durationMinutes
            }
        };

        const eventId = await createCalendarEvent(mockBooking);
        console.log('Calendar Event ID:', eventId);

        console.log('4. Updating Booking...');
        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CONFIRMED }
        });
        console.log('Booking updated:', updated.status);

        // Cleanup
        await prisma.booking.delete({ where: { id: booking.id } });
        await prisma.service.delete({ where: { id: service.id } });

    } catch (error) {
        console.error('❌ Error in debug script:', error);
    }
}

debugPrisma();
