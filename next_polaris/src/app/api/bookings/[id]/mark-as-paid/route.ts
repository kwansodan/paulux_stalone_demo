import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentService } from "@/features/payment/server/payment.service";
import { calculatePaymentStatus } from "@/features/payment/utils/helpers";
import { calculateBookingTotal } from "@/features/booking/utils/helpers";
import { PaymentProvider, PaymentStatus } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { inngest } from "@/lib/inngest";
import { bookingInclude } from "@/lib/prisma-includes";

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

        const totalPrice = calculateBookingTotal(booking);

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

        // Optional partial amount + payment method
        const body = await request.json().catch(() => ({}));
        const requestedAmount = body?.amount ? Number(body.amount) : null;
        const methodId: string | null = body?.methodId ?? null;

        // Resolve method name for downstream use (receipt email, audit log)
        let methodName = "Manual"
        if (methodId) {
            const method = await prisma.manualPaymentMethod.findUnique({ where: { id: methodId } })
            if (!method) {
                return NextResponse.json({ success: false, message: "Payment method not found" }, { status: 400 })
            }
            methodName = method.name
        }

        if (requestedAmount !== null) {
            if (isNaN(requestedAmount) || requestedAmount <= 0) {
                return NextResponse.json(
                    { success: false, message: "Amount must be greater than 0" },
                    { status: 400 }
                );
            }
            if (requestedAmount > remainingBalance) {
                return NextResponse.json(
                    { success: false, message: `Amount cannot exceed remaining balance of GHS ${remainingBalance.toFixed(2)}` },
                    { status: 400 }
                );
            }
        }

        const amountToRecord = requestedAmount ?? remainingBalance;

        // Create MANUAL payment record
        await prisma.payment.create({
            data: {
                bookingId: booking.id,
                provider: PaymentProvider.MANUAL,
                providerRef: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                amount: amountToRecord,
                currency: booking.services[0]?.service.currency || "GHS",
                status: PaymentStatus.PAID,
                manualMethodId: methodId ?? undefined,
                rawPayload: { method: methodName, markedByAdminId: auth.user.id },
            }
        });

        // Refresh payment status
        await paymentService.refreshBookingPaymentStatus(booking.id);

        // Update booking status to CONFIRMED
        if (booking.status !== 'CONFIRMED') {
            booking = await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'CONFIRMED' },
                include: bookingInclude,
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
                amountPaid: amountToRecord,
                provider: PaymentProvider.MANUAL,
                manualMethodName: methodName,
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
