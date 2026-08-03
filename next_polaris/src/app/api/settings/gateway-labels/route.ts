import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import {
  GATEWAY_LABEL_PRIMARY_KEY,
  GATEWAY_LABEL_SECONDARY_KEY,
  MAX_GATEWAY_LABEL_LENGTH,
  getGatewayLabels,
} from "@/features/payment/server/gateway-labels"

// Admin-only. These are display names for the two payment gateways; all routing
// and payment logic keys off the PaymentProvider enum, not these strings.

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const labels = await getGatewayLabels()
    return NextResponse.json({ success: true, data: labels })
  } catch (error: any) {
    console.error("Error getting gateway labels:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const primary = typeof body?.primary === "string" ? body.primary.trim() : ""
    const secondary = typeof body?.secondary === "string" ? body.secondary.trim() : ""

    if (!primary || !secondary) {
      return NextResponse.json(
        { success: false, message: "Both gateway names are required" },
        { status: 400 }
      )
    }
    if (primary.length > MAX_GATEWAY_LABEL_LENGTH || secondary.length > MAX_GATEWAY_LABEL_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Names must be ${MAX_GATEWAY_LABEL_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: GATEWAY_LABEL_PRIMARY_KEY },
        update: { value: primary },
        create: { key: GATEWAY_LABEL_PRIMARY_KEY, value: primary },
      }),
      prisma.systemSetting.upsert({
        where: { key: GATEWAY_LABEL_SECONDARY_KEY },
        update: { value: secondary },
        create: { key: GATEWAY_LABEL_SECONDARY_KEY, value: secondary },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Gateway names updated",
      data: { primary, secondary },
    })
  } catch (error: any) {
    console.error("Error updating gateway labels:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
