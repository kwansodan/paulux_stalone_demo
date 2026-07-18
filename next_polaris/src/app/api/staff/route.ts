import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/helpers";
import { UserRole } from "@generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // ?stylistsOnly=true powers the assign-stylist dropdown, so it's reachable by
        // anyone who can manage bookings; the full staff list stays settings-gated.
        const stylistsOnly = request.nextUrl.searchParams.get("stylistsOnly") === "true";

        const auth = await requireRoleApi(["ADMIN"], stylistsOnly ? "bookings.view" : "settings.view");
        if (!auth.ok) return auth.response;

        const staff = await prisma.user.findMany({
            where: { role: UserRole.STAFF, ...(stylistsOnly ? { isStylist: true } : {}) },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                isStylist: true,
                customRoleId: true,
                customRole: { select: { id: true, name: true } },
                createdAt: true,
            },
            orderBy: { username: "asc" },
        });

        return NextResponse.json({ success: true, data: staff });
    } catch (error: any) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "settings.view");
        if (!auth.ok) return auth.response;

        const body = await request.json();
        const { username, email, phone } = body;
        const isStylist: boolean = body?.isStylist === true;
        const customRoleId: string | null = body?.customRoleId ?? null;

        if (!username || username.trim().length < 2) {
            return NextResponse.json(
                { success: false, message: "Display name must be at least 2 characters" },
                { status: 400 }
            );
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return NextResponse.json(
                { success: false, message: "A valid email address is required" },
                { status: 400 }
            );
        }

        // Check for duplicates
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username.trim() },
                    { email: email.trim().toLowerCase() },
                ],
            },
        });

        if (existing) {
            const field = existing.username === username.trim() ? "username" : "email";
            return NextResponse.json(
                { success: false, message: `A user with that ${field} already exists` },
                { status: 409 }
            );
        }

        // If an admin role is provided, make sure it exists before creating.
        if (customRoleId) {
            const role = await prisma.role.findUnique({ where: { id: customRoleId } });
            if (!role) {
                return NextResponse.json(
                    { success: false, message: "Selected role not found" },
                    { status: 400 }
                );
            }
        }

        // Generate a temporary password
        const tempPassword =
            Math.random().toString(36).slice(2, 7).toUpperCase() +
            Math.random().toString(36).slice(2, 5) +
            Math.floor(10 + Math.random() * 90);

        const passwordHash = await hashPassword(tempPassword);

        const staff = await prisma.user.create({
            data: {
                username: username.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() || null,
                passwordHash,
                role: UserRole.STAFF,
                isStylist,
                customRoleId,
            },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                isStylist: true,
                customRoleId: true,
                customRole: { select: { id: true, name: true } },
                createdAt: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Staff member created",
                data: { staff, tempPassword },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating staff:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
