import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { bookingInclude } from "@/lib/prisma-includes";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "bookings.view");
        if (!auth.ok) return auth.response;

        const bookingId = (await params).id;
        const body = await request.json();
        const { stylistId } = body; // null to unassign

        // Validate booking exists
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            return NextResponse.json(
                { success: false, message: "Booking not found" },
                { status: 404 }
            );
        }

        // If assigning, validate the assignee is a STAFF user flagged as a stylist
        if (stylistId !== null && stylistId !== undefined) {
            const stylist = await prisma.user.findUnique({
                where: { id: stylistId },
                select: { id: true, role: true, isStylist: true } as any,
            }) as { id: string; role: UserRole; isStylist?: boolean } | null;
            if (!stylist || stylist.role !== UserRole.STAFF || !stylist.isStylist) {
                return NextResponse.json(
                    { success: false, message: "Assignee not found or is not a stylist" },
                    { status: 400 }
                );
            }
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { assignedToId: stylistId ?? null },
            include: bookingInclude,
        });

        return NextResponse.json({
            success: true,
            message: stylistId ? "Stylist assigned" : "Stylist unassigned",
            data: updated,
        });
    } catch (error: any) {
        console.error("Error assigning stylist:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
