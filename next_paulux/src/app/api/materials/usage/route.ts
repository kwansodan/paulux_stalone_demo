import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { materialRepository } from "@/features/material/server/material.repository"

/**
 * Material cost-by-section report.
 * Query params: from, to (ISO dates). Defaults to the current month.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRoleApi(["ADMIN"], "materials.view")
  if (!auth.ok) return auth.response

  const sp = request.nextUrl.searchParams
  const now = new Date()

  const from = sp.get("from")
    ? new Date(sp.get("from")!)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = sp.get("to")
    ? new Date(sp.get("to")!)
    : now

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ success: false, message: "Invalid date range" }, { status: 400 })
  }

  // Make `to` inclusive through end of day.
  to.setHours(23, 59, 59, 999)

  const report = await materialRepository.getUsageBySection(from, to)
  return NextResponse.json({ success: true, data: report })
}
