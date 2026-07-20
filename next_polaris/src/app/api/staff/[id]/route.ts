import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const db = prisma as any

// All fields optional so the same endpoint can toggle the role, the stylist
// capability, or active status — individually or together.
const PatchStaffSchema = z.object({
  customRoleId: z.string().uuid().nullable().optional(),
  isStylist: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

const STAFF_SELECT = {
  id: true,
  username: true,
  email: true,
  phone: true,
  role: true,
  isStylist: true,
  isActive: true,
  customRoleId: true,
  customRole: { select: { id: true, name: true } },
  createdAt: true,
}

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

  // This endpoint manages staff accounts only — not admins.
  if (user.role !== UserRole.STAFF) {
    return NextResponse.json(
      { success: false, message: "Only staff accounts can be managed here" },
      { status: 400 }
    )
  }

  // Guard against locking yourself out.
  if (parsed.data.isActive === false && auth.user?.id === id) {
    return NextResponse.json(
      { success: false, message: "You cannot deactivate your own account" },
      { status: 400 }
    )
  }

  if (parsed.data.customRoleId) {
    const role = await db.role.findUnique({ where: { id: parsed.data.customRoleId } })
    if (!role) return NextResponse.json({ success: false, message: "Role not found" }, { status: 404 })
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(parsed.data.customRoleId !== undefined ? { customRoleId: parsed.data.customRoleId } : {}),
      ...(parsed.data.isStylist !== undefined ? { isStylist: parsed.data.isStylist } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
    select: STAFF_SELECT,
  })

  // Revoke access immediately on deactivation rather than waiting for expiry.
  if (parsed.data.isActive === false) {
    await prisma.session.deleteMany({ where: { userId: id } })
  }

  return NextResponse.json({
    success: true,
    message: parsed.data.isActive === false ? "Staff member deactivated" : "Staff member updated",
    data: { ...updated, createdAt: updated.createdAt.toISOString() },
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi([UserRole.ADMIN], "settings.view")
    if (!auth.ok) return auth.response

    const { id } = await params

    if (auth.user?.id === id) {
      return NextResponse.json(
        { success: false, message: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })

    if (user.role !== UserRole.STAFF) {
      return NextResponse.json(
        { success: false, message: "Only staff accounts can be deleted here" },
        { status: 400 }
      )
    }

    // Sessions/tokens cascade; historical attribution (bookings created/assigned,
    // stock + material movements, gift-card redemptions) is nulled by the schema's
    // SetNull rules, so records survive without the person.
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Staff member deleted" })
  } catch (error: any) {
    console.error("Error deleting staff member:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete staff member" },
      { status: 500 }
    )
  }
}
