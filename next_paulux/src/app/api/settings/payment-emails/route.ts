import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import {
  PAYMENT_EMAILS_KEY,
  parseEmailList,
  getPaymentNotificationRecipients,
} from "@/features/payment/server/payment-recipients"

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const setting = await prisma.systemSetting.findUnique({ where: { key: PAYMENT_EMAILS_KEY } })
    const emails = parseEmailList(setting?.value)
    // When no list is configured, payments fall back to all admin accounts.
    const effective = await getPaymentNotificationRecipients()

    return NextResponse.json({
      success: true,
      data: {
        emails,
        usingFallback: emails.length === 0,
        effectiveRecipients: effective.map((r) => r.email),
      },
    })
  } catch (error: any) {
    console.error("Error getting payment notification emails:", error)
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
    const raw: string = typeof body?.value === "string" ? body.value : ""

    // Reject if the user typed something that contains no valid email at all
    // (but allow a deliberately empty value, which resets to the admin fallback).
    const emails = parseEmailList(raw)
    if (raw.trim() !== "" && emails.length === 0) {
      return NextResponse.json(
        { success: false, message: "Enter at least one valid email address, or leave blank to notify all admins." },
        { status: 400 }
      )
    }

    const value = emails.join(", ")
    await prisma.systemSetting.upsert({
      where: { key: PAYMENT_EMAILS_KEY },
      update: { value },
      create: { key: PAYMENT_EMAILS_KEY, value },
    })

    return NextResponse.json({
      success: true,
      message: emails.length > 0 ? "Payment notification recipients updated" : "Cleared — payment emails will go to all admins",
      data: { emails, usingFallback: emails.length === 0 },
    })
  } catch (error: any) {
    console.error("Error updating payment notification emails:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
