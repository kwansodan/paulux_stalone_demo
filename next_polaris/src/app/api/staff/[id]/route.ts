import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const db = prisma as any

// Both fields optional so the same endpoint can toggle the role, the stylist
// capability, or both. `.strict()` would reject unknown keys; keep it lenient.
const PatchStaffSchema = z.object({
  customRoleId: z.string().uuid().nullable().optional(),
  isStylist: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi([UserRole.ADMIN], "settings.view")
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
    data: {
      ...(parsed.data.customRoleId !== undefined ? { customRoleId: parsed.data.customRoleId } : {}),
      ...(parsed.data.isStylist !== undefined ? { isStylist: parsed.data.isStylist } : {}),
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      isStylist: true,
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
