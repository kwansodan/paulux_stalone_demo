import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Lets front-desk staff recognize a returning customer by phone number alone,
// instead of asking them to repeat their name/email every visit. Matches on
// the last 9 digits so 024xxxxxxx / 233 24xxxxxxx / +233 24xxxxxxx all hit
// the same person regardless of how the number was typed previously.
export async function GET(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "bookings.view");
        if (!auth.ok) return auth.response;

        const phone = request.nextUrl.searchParams.get("phone") || "";
        const digits = phone.replace(/\D/g, "");
        const last9 = digits.slice(-9);

        if (last9.length < 9) {
            return NextResponse.json({ success: true, data: { found: false } });
        }

        const mostRecent = await prisma.booking.findFirst({
            where: { clientPhone: { contains: last9 } },
            orderBy: { createdAt: "desc" },
            select: { clientName: true, clientEmail: true },
        });

        if (!mostRecent) {
            return NextResponse.json({ success: true, data: { found: false } });
        }

        // Count visits for this phone+name pair, not phone alone — the same
        // number can be reused across different real customers (a shared
        // household line, or a placeholder entered for someone who doesn't
        // want to share their number), which would otherwise inflate this
        // person's visit count with strangers' bookings.
        const visitCount = await prisma.booking.count({
            where: {
                clientPhone: { contains: last9 },
                clientName: { equals: mostRecent.clientName, mode: "insensitive" },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                found: true,
                clientName: mostRecent.clientName,
                clientEmail: mostRecent.clientEmail,
                visitCount,
            },
        });
    } catch (error: any) {
        console.error("Error looking up customer by phone:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Lookup failed" },
            { status: 500 }
        );
    }
}
