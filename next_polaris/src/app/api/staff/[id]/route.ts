import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const db = prisma as any

const PatchStaffSchema = z.object({
  customRoleId: z.string().uuid().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi([UserRole.ADMIN])
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const parsed = PatchStaffSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })

  if (parsed.data.customRoleId) {
    const role = await db.role.findUnique({ where: { id: parsed.data.customRoleId } })
    if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 })
  }

  const updated = await db.user.update({
    where: { id },
    data: { customRoleId: parsed.data.customRoleId },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      customRoleId: true,
      customRole: { select: { id: true, name: true } },
      createdAt: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: { ...updated, createdAt: updated.createdAt.toISOString() },
  })
}
