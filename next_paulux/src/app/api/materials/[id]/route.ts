import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { materialRepository } from "@/features/material/server/material.repository"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, message: "Material ID is required" }, { status: 400 })
    }

    const deleted = await materialRepository.deleteById(id)
    return NextResponse.json({ success: true, message: `${deleted.name} deleted successfully` }, { status: 200 })
  } catch (error) {
    console.error("Material delete error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete material" }, { status: 500 })
  }
}
