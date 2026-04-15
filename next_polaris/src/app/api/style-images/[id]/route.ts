import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/minio"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdateStyleImageSchema = z.object({
  caption: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const validated = UpdateStyleImageSchema.parse(body)

    const image = await prisma.styleImage.update({
      where: { id },
      data: {
        ...(validated.caption !== undefined && { caption: validated.caption }),
        ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    })

    return NextResponse.json({ success: true, data: image })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Image not found" }, { status: 404 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const { id } = await params

    const image = await prisma.styleImage.findUnique({ where: { id } })
    if (!image) {
      return NextResponse.json({ success: false, message: "Image not found" }, { status: 404 })
    }

    // Remove from MinIO first, then DB
    await deleteFile(image.objectName).catch((err) =>
      console.error("MinIO delete failed (continuing):", err)
    )

    await prisma.styleImage.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Image deleted" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
