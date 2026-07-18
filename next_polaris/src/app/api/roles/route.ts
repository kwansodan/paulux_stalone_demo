import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const db = prisma as any

const RoleSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  permissions: z.array(z.string()),
})

export async function GET() {
  const auth = await requireRoleApi([UserRole.ADMIN], "roles.manage")
  if (!auth.ok) return auth.response

  const roles = await db.role.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    success: true,
    data: roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      isSystem: r.isSystem,
      userCount: r._count.users,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireRoleApi([UserRole.ADMIN], "roles.manage")
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = RoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const existing = await db.role.findUnique({ where: { name: parsed.data.name } })
  if (existing) {
    return NextResponse.json({ success: false, message: "A role with this name already exists" }, { status: 409 })
  }

  const role = await db.role.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      permissions: parsed.data.permissions,
    },
  })

  return NextResponse.json({ success: true, data: { ...role, userCount: 0, createdAt: role.createdAt.toISOString(), updatedAt: role.updatedAt.toISOString() } }, { status: 201 })
}
