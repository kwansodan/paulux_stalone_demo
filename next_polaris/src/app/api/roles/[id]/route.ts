import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const db = prisma as any

const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(200).nullable().optional(),
  permissions: z.array(z.string()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi([UserRole.ADMIN])
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const parsed = UpdateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const role = await db.role.findUnique({ where: { id } })
  if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 })

  if (parsed.data.name && parsed.data.name !== role.name) {
    const conflict = await db.role.findUnique({ where: { name: parsed.data.name } })
    if (conflict) {
      return NextResponse.json({ success: false, message: "A role with this name already exists" }, { status: 409 })
    }
  }

  const updated = await db.role.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.permissions !== undefined && { permissions: parsed.data.permissions }),
    },
    include: { _count: { select: { users: true } } },
  })

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      userCount: updated._count.users,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi([UserRole.ADMIN])
  if (!auth.ok) return auth.response

  const { id } = await params

  const role = await db.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 })
  if (role.isSystem) return NextResponse.json({ success: false, message: "Cannot delete a system role" }, { status: 403 })

  // Unassign users first
  await db.user.updateMany({ where: { customRoleId: id }, data: { customRoleId: null } })
  await db.role.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
