import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi } from "@/app/_auth/require-role-api";
import { bookingRepository } from "@/features/booking/server/booking.repository";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "bookings.view");
        if (!auth.ok) return auth.response;

        const searchParams = request.nextUrl.searchParams;
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json(
                { success: false, message: "from and to query params are required" },
                { status: 400 }
            );
        }

        const counts = await bookingRepository.getBookingCountsByDateRange(from, to);

        return NextResponse.json({ success: true, data: counts });
    } catch (error: any) {
        console.error("Error fetching booking calendar counts:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to fetch booking counts" },
            { status: 500 }
        );
    }
}
