import { NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { sectionRepository } from "@/features/material/server/section.repository"

/** Idempotently seed sections from existing service categories + defaults. */
export async function POST() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const sections = await sectionRepository.seedFromServiceCategories()
    return NextResponse.json({ success: true, message: "Sections ready", data: sections })
  } catch (error: any) {
    console.error("Error seeding sections:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to seed sections" }, { status: 500 })
  }
}
