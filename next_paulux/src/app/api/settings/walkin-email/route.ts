import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const SETTING_KEY = "walkin_email";
const DEFAULT_EMAIL = "walkin@pauluxbooking.com";

export async function GET() {
    try {
        const auth = await requireRoleApi(["ADMIN"], "settings.view");
        if (!auth.ok) return auth.response;

        const setting = await prisma.systemSetting.findUnique({
            where: { key: SETTING_KEY },
        });

        return NextResponse.json({
            success: true,
            data: { email: setting?.value ?? DEFAULT_EMAIL },
        });
    } catch (error: any) {
        console.error("Error getting walkin email setting:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireRoleApi(["ADMIN"], "settings.view");
        if (!auth.ok) return auth.response;

        const body = await request.json();
        const email = body?.email?.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { success: false, message: "A valid email address is required" },
                { status: 400 }
            );
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key: SETTING_KEY },
            update: { value: email },
            create: { key: SETTING_KEY, value: email },
        });

        return NextResponse.json({
            success: true,
            message: "Walk-in email updated",
            data: { email: setting.value },
        });
    } catch (error: any) {
        console.error("Error updating walkin email setting:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
