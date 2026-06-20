import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/features/payment/server/payment.service";
import { bookingRepository } from "@/features/booking/server/booking.repository";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok) return auth.response;

        const { id: bookingId } = await params;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
        }

        // Find the most recent online payment attempt for this booking — either an
        // unpaid invoice (unified flow) or a non-PAID Paystack payment record (legacy flow).
        const invoice = await prisma.invoice.findFirst({
            where: { bookingId, status: { not: "PAID" }, gateway: { not: null } },
            orderBy: { createdAt: "desc" },
        });

        const reference = invoice?.invoiceNumber
            ?? (await prisma.payment.findFirst({
                where: {
                    bookingId,
                    status: { not: "PAID" },
                    provider: { in: ["PRIMARY_PAYSTACK", "SECONDARY_PAYSTACK"] },
                },
                orderBy: { createdAt: "desc" },
            }))?.providerRef;

        if (!reference) {
            return NextResponse.json(
                { success: false, message: "No online payment attempt found for this booking" },
                { status: 400 }
            );
        }

        const result = await paymentService.verifyAndSyncTransaction(reference);

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message || "Paystack could not verify this transaction" },
                { status: 400 }
            );
        }

        const updatedBooking = await bookingRepository.findById(bookingId);

        return NextResponse.json({
            success: true,
            message: `Paystack reports this transaction as "${result.paystackStatus}"`,
            data: {
                reference,
                paystackStatus: result.paystackStatus,
                paymentStatus: updatedBooking?.paymentStatus,
            },
        });
    } catch (error: any) {
        console.error("Error rechecking payment with Paystack:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to recheck payment" },
            { status: 500 }
        );
    }
}
