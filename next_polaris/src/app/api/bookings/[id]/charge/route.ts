import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";
import { paymentProcessingService } from "@/features/payment/server/payment-processing.service";
import { sendPaymentLinkEmail } from "@/features/booking/emails/send-payment-link-email";
import { BookingStatus, PaymentStatus } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok) return auth.response;

        const bookingId = (await params).id;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.paymentStatus === PaymentStatus.PAID) {
            return NextResponse.json(
                { success: false, message: "Booking is already paid" },
                { status: 400 }
            );
        }

        const paymentResult = await paymentProcessingService.initializePayment({
            bookingId: booking.id,
            email: booking.clientEmail,
            amount: Number(booking.service.price),
            bookingReference: booking.bookingReference,
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/confirmation?reference=${booking.bookingReference}`
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
            await sendPaymentLinkEmail(
                booking.clientEmail,
                booking.clientName,
                booking.service.name,
                Number(booking.service.price),
                paymentResult.paymentUrl,
                booking.bookingDate,
                booking.bookingTime
            );

            return NextResponse.json({
                success: true,
                message: "Payment link sent to customer",
                data: { paymentUrl: paymentResult.paymentUrl }
            });
        } else {
            return NextResponse.json(
                { success: false, message: paymentResult.message || "Failed to initialize payment" },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in charge endpoint:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
