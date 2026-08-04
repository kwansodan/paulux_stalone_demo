import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const CreateStyleImageSchema = z.object({
  url: z.string().url(),
  objectName: z.string().min(1),
  caption: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    // Returning inactive images is an admin-only operation
    if (all) {
      const auth = await requireRoleApi(["ADMIN"], "settings.view")
      if (!auth.ok) return auth.response
    }

    const images = await prisma.styleImage.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ success: true, data: images })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = CreateStyleImageSchema.parse(body)

    const maxOrder = await prisma.styleImage.aggregate({ _max: { sortOrder: true } })
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

    const image = await prisma.styleImage.create({
      data: {
        url: validated.url,
        objectName: validated.objectName,
        caption: validated.caption ?? null,
        sortOrder: validated.sortOrder ?? nextOrder,
      },
    })

    return NextResponse.json({ success: true, data: image }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
