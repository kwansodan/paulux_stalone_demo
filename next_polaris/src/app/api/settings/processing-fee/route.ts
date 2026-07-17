import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { PROCESSING_FEE_RATE_KEY, getProcessingFeeRate } from "@/features/payment/server/fee-settings"

// Admin-only: the rate is never shown to customers (the surcharge is silent), so
// there is no public endpoint. The API speaks PERCENT to the UI (e.g. 1.95) but
// stores the FRACTION (0.0195) that getProcessingFeeRate() expects.

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const rate = await getProcessingFeeRate()
    return NextResponse.json({ success: true, data: { rate, percent: rate * 100 } })
  } catch (error: any) {
    console.error("Error getting processing fee:", error)
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
    const percent = Number(body?.percent)

    // Percent in [0, 50) → fraction in [0, 0.5). Blank/invalid is rejected.
    if (!Number.isFinite(percent) || percent < 0 || percent >= 50) {
      return NextResponse.json(
        { success: false, message: "Fee must be a percentage between 0 and 50" },
        { status: 400 }
      )
    }

    const fraction = percent / 100

    await prisma.systemSetting.upsert({
      where: { key: PROCESSING_FEE_RATE_KEY },
      update: { value: String(fraction) },
      create: { key: PROCESSING_FEE_RATE_KEY, value: String(fraction) },
    })

    return NextResponse.json({
      success: true,
      message: "Processing fee updated",
      data: { rate: fraction, percent },
    })
  } catch (error: any) {
    console.error("Error updating processing fee:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
