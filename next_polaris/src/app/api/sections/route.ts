import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { sectionRepository } from "@/features/material/server/section.repository"
import { SectionInputSchema } from "@/features/material/utils/validation"

export async function GET(request: NextRequest) {
  const auth = await requireRoleApi(["ADMIN"], "materials.view")
  if (!auth.ok) return auth.response

  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true"
  const sections = await sectionRepository.getAll(activeOnly)
  return NextResponse.json({ success: true, data: sections })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "materials.manage")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = SectionInputSchema.parse(body)
    const section = await sectionRepository.create(validated)
    return NextResponse.json({ success: true, message: "Section created", data: section })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, message: "A section with that name already exists" }, { status: 409 })
    }
    console.error("Error creating section:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to create section" }, { status: 500 })
  }
}
