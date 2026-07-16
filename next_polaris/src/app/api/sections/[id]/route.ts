import { requireRoleApi } from "@/app/_auth/require-role-api"
import { sectionRepository } from "@/features/material/server/section.repository"
import { UpdateSectionSchema } from "@/features/material/utils/validation"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const validated = UpdateSectionSchema.parse(body)

    const section = await sectionRepository.update(id, validated)

    return NextResponse.json({ success: true, data: section })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      )
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A section with this name already exists" },
        { status: 409 }
      )
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Section not found" }, { status: 404 })
    }
    console.error("Error updating section:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update section" },
      { status: 500 }
    )
  }
}
