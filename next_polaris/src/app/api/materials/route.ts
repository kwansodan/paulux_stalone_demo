import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { materialRepository } from "@/features/material/server/material.repository"
import { MaterialUpsertSchema } from "@/features/material/utils/validation"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.view")
    if (!auth.ok) return auth.response

    const materials = await materialRepository.getAll({})
    return NextResponse.json({ success: true, data: materials }, { status: 200 })
  } catch (error) {
    console.error("Error getting materials:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = MaterialUpsertSchema.parse(body)
    const material = await materialRepository.upsert(validated)

    return NextResponse.json({ success: true, message: "Material saved successfully", data: material }, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error upserting material:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to save material" }, { status: 500 })
  }
}
