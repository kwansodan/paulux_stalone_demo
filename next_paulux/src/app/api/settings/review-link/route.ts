import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { GOOGLE_REVIEW_LINK_KEY } from "@/features/feedback/server/review-settings"

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const setting = await prisma.systemSetting.findUnique({ where: { key: GOOGLE_REVIEW_LINK_KEY } })
    return NextResponse.json({ success: true, data: { link: setting?.value || null } })
  } catch (error: any) {
    console.error("Error getting review link setting:", error)
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
    const link = typeof body?.link === "string" ? body.link.trim() : ""

    if (link && !/^https?:\/\/.+/i.test(link)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid URL starting with http:// or https://" },
        { status: 400 }
      )
    }

    await prisma.systemSetting.upsert({
      where: { key: GOOGLE_REVIEW_LINK_KEY },
      update: { value: link },
      create: { key: GOOGLE_REVIEW_LINK_KEY, value: link },
    })

    return NextResponse.json({
      success: true,
      message: link ? "Review link updated" : "Review link cleared",
      data: { link: link || null },
    })
  } catch (error: any) {
    console.error("Error updating review link setting:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
