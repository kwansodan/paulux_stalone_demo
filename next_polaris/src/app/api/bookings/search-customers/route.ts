import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_RESULTS = 6;

// Lets front-desk staff search past customers by name as they type — names
// aren't unique, so this returns multiple candidates (with phone + visit
// count) for staff to disambiguate, rather than silently picking one.
export async function GET(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "bookings.view");
        if (!auth.ok) return auth.response;

        const query = (request.nextUrl.searchParams.get("q") || "").trim();
        if (query.length < 2) {
            return NextResponse.json({ success: true, data: { results: [] } });
        }

        const matches = await prisma.booking.findMany({
            where: { clientName: { contains: query, mode: "insensitive" } },
            orderBy: { createdAt: "desc" },
            select: { clientName: true, clientEmail: true, clientPhone: true },
            take: 100,
        });

        // Dedupe by phone, keeping the most recent name/email on file for that person.
        const byPhone = new Map<string, { clientName: string; clientEmail: string; clientPhone: string }>();
        for (const m of matches) {
            if (!m.clientPhone || byPhone.has(m.clientPhone)) continue;
            byPhone.set(m.clientPhone, m);
            if (byPhone.size >= MAX_RESULTS) break;
        }

        // Count visits per (phone, name) pair, not phone alone — the same
        // phone number can be reused across different real customers (a
        // shared household line, or a placeholder a front-desk staffer enters
        // for someone who doesn't want to share their number), so counting by
        // phone only would inflate one person's visit count with strangers'
        // bookings that merely share that number.
        const entries = Array.from(byPhone.values());
        const counts = await Promise.all(
            entries.map((m) =>
                prisma.booking.count({
                    where: { clientPhone: m.clientPhone, clientName: { equals: m.clientName, mode: "insensitive" } },
                })
            )
        );

        const results = entries.map((m, i) => ({
            clientName: m.clientName,
            clientEmail: m.clientEmail,
            clientPhone: m.clientPhone,
            visitCount: counts[i] || 1,
        }));

        return NextResponse.json({ success: true, data: { results } });
    } catch (error: any) {
        console.error("Error searching customers by name:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Search failed" },
            { status: 500 }
        );
    }
}
