import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { materialRepository } from "@/features/material/server/material.repository"
import { MaterialStatusSchema } from "@/features/material/utils/validation"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const { isActive } = MaterialStatusSchema.parse(body)

    const material = await materialRepository.findById(id)
    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 })
    }
    if (material.isActive === isActive) {
      return NextResponse.json(
        { success: false, error: "Material status is already set to that value" },
        { status: 409 }
      )
    }

    const updated = await materialRepository.updateStatus(id, isActive)
    return NextResponse.json({ success: true, message: "Material status updated", data: updated })
  } catch (error: any) {
    console.error("Material status error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update material status" },
      { status: 500 }
    )
  }
}
