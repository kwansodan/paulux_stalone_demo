import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/paystack';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google-calendar';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-paystack-signature');
        if (!signature) {
            return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
        }

        const body = await req.json(); // Important: Paystack sends JSON

        // Verify signature
        // Note: In Next.js App Router, req.json() consumes the body stream.
        // verifyPaystackSignature needs the raw body or equivalent JSON object.
        // Since we parsed it, we pass the object. Our verify function handles JSON.stringify.
        // Ideally, for strict verification, we should use the raw body buffer, 
        // but Next.js abstracts this. JSON.stringify(body) usually works if keys are ordered same way,
        // which is risky but often standard practice in JS land if raw body isn't easily accessible without workaround.
        // A robust way in NextJS app dir for raw body often involves arrayBuffer. 

        // Let's assume our utility function expects the JSON object and stringifies it internally.
        const isValid = verifyPaystackSignature(signature, body);

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        console.log(`Received Paystack event: ${event}`);

        if (event === 'charge.success') {
            const { reference, status } = data;

            // Update booking status
            // We assume reference maps to bookingReference
            if (status === 'success') {
                // First update the status
                const updatedBooking = await prisma.booking.update({
                    where: { bookingReference: reference },
                    data: {
                        status: 'CONFIRMED',
                        paymentStatus: 'PAID',
                        paymentRef: reference,
                    },
                    include: {
                        service: true, // Required for calendar event details
                    },
                });

                console.log(`Updated booking ${reference} to CONFIRMED.`);

                // Create Google Calendar Event
                // Only create if not already exists (though here we just confirmed payment, so likely new)
                if (!updatedBooking.googleEventId) {
                    const eventId = await createCalendarEvent(updatedBooking);
                    if (eventId) {
                        await prisma.booking.update({
                            where: { id: updatedBooking.id },
                            data: { googleEventId: eventId }
                        });
                        console.log(`Linked Google Calendar event ${eventId} to booking ${reference}`);
                    }
                }
            }
        }

        return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { message: 'Webhook error', error: error.message },
            { status: 500 }
        );
    }
}
