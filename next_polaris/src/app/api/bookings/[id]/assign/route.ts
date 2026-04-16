import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
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

        // If assigning, validate the stylist is a STAFF user
        if (stylistId !== null && stylistId !== undefined) {
            const stylist = await prisma.user.findUnique({
                where: { id: stylistId },
                select: { id: true, role: true },
            });
            if (!stylist || stylist.role !== UserRole.STAFF) {
                return NextResponse.json(
                    { success: false, message: "Stylist not found or is not a staff member" },
                    { status: 400 }
                );
            }
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { assignedToId: stylistId ?? null },
            include: {
                assignedTo: {
                    select: { id: true, username: true, phone: true },
                },
            },
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
