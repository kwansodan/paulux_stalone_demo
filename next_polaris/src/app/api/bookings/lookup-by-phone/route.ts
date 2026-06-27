import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Lets front-desk staff recognize a returning customer by phone number alone,
// instead of asking them to repeat their name/email every visit. Matches on
// the last 9 digits so 024xxxxxxx / 233 24xxxxxxx / +233 24xxxxxxx all hit
// the same person regardless of how the number was typed previously.
export async function GET(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"]);
        if (!auth.ok) return auth.response;

        const phone = request.nextUrl.searchParams.get("phone") || "";
        const digits = phone.replace(/\D/g, "");
        const last9 = digits.slice(-9);

        if (last9.length < 9) {
            return NextResponse.json({ success: true, data: { found: false } });
        }

        const [mostRecent, visitCount] = await Promise.all([
            prisma.booking.findFirst({
                where: { clientPhone: { contains: last9 } },
                orderBy: { createdAt: "desc" },
                select: { clientName: true, clientEmail: true },
            }),
            prisma.booking.count({ where: { clientPhone: { contains: last9 } } }),
        ]);

        if (!mostRecent) {
            return NextResponse.json({ success: true, data: { found: false } });
        }

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
