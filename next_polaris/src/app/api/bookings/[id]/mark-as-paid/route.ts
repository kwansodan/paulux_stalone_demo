import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentService } from "@/features/payment/server/payment.service";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";
import { PaymentProvider, PaymentStatus } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { inngest } from "@/lib/inngest";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok || !auth.user) return auth.response || NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const bookingId = (await params).id;

        let booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        const bookingPaymentStatus = calculatePaymentStatus(booking);
        if (bookingPaymentStatus === PaymentStatus.PAID) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid" },
                { status: 400 }
            );
        }

        const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0);

        // Filter for PAID payments
        const paidPayments = booking.payments?.filter(p => p.status === PaymentStatus.PAID) || [];
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingBalance = totalPrice - totalPaid;

        if (remainingBalance <= 0) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid in full" },
                { status: 400 }
            );
        }

        // Create MANUAL payment record
        await prisma.payment.create({
            data: {
                bookingId: booking.id,
                provider: PaymentProvider.MANUAL,
                providerRef: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                amount: remainingBalance,
                currency: booking.services[0]?.service.currency || "GHS",
                status: PaymentStatus.PAID,
                rawPayload: { method: "CASH_IN_PERSON", markedByAdminId: auth.user.id },
            }
        });

        // Refresh payment status
        await paymentService.refreshBookingPaymentStatus(booking.id);

        // Update booking status to CONFIRMED
        if (booking.status !== 'CONFIRMED') {
            booking = await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CONFIRMED',
                },
                include: { services: { include: { service: true } }, payments: true }
            });
            console.log(`Updated booking ${booking.bookingReference} to CONFIRMED via Manual Payment`);
        }

        // Create Google Calendar Event
        if (!booking.googleEventId) {
            try {
                const eventId = await createCalendarEvent(booking);
                if (eventId) {
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { googleEventId: eventId }
                    });
                }
            } catch (error) {
                console.error('Failed to create calendar event:', error);
            }
        }

        // Send payment received event for notifications
        await inngest.send({
            name: "app/payment.payment-received",
            data: {
                bookingId: booking.id,
                amountPaid: remainingBalance,
                provider: PaymentProvider.MANUAL,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Marked as paid successfully",
        });

    } catch (error: any) {
        console.error("Error in mark-as-paid endpoint:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
