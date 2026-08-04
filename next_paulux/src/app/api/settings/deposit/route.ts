import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { GLOBAL_MIN_DEPOSIT_KEY } from "@/features/payment/server/deposit-settings"

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const setting = await prisma.systemSetting.findUnique({ where: { key: GLOBAL_MIN_DEPOSIT_KEY } })
    const amount = setting?.value ? Number(setting.value) : null
    const enabled = amount != null && Number.isFinite(amount) && amount > 0

    return NextResponse.json({
      success: true,
      data: { enabled, amount: enabled ? amount : null },
    })
  } catch (error: any) {
    console.error("Error getting global deposit setting:", error)
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
    const rawAmount = body?.amount

    // An empty/null amount clears the override — falls back to per-service deposits.
    if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
      await prisma.systemSetting.upsert({
        where: { key: GLOBAL_MIN_DEPOSIT_KEY },
        update: { value: "" },
        create: { key: GLOBAL_MIN_DEPOSIT_KEY, value: "" },
      })
      return NextResponse.json({ success: true, message: "Global deposit override cleared", data: { enabled: false, amount: null } })
    }

    const amount = Number(rawAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a non-negative number" },
        { status: 400 }
      )
    }

    await prisma.systemSetting.upsert({
      where: { key: GLOBAL_MIN_DEPOSIT_KEY },
      update: { value: String(amount) },
      create: { key: GLOBAL_MIN_DEPOSIT_KEY, value: String(amount) },
    })

    return NextResponse.json({
      success: true,
      message: "Global deposit override updated",
      data: { enabled: amount > 0, amount: amount > 0 ? amount : null },
    })
  } catch (error: any) {
    console.error("Error updating global deposit setting:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
