import { UserRole } from "@generated/prisma/client"
import { NextResponse } from "next/server"
import { requireAuthApi } from "./require-auth-api"
import { PermissionKey } from "@/lib/permissions"

export async function requireRoleApi(allowed: UserRole[], permission?: PermissionKey) {
  const auth = await requireAuthApi()
  if (!auth.ok || !auth.user) return auth

  const { user } = auth

  if ((user.role as string) === "SUPER_ADMIN" || user.role === UserRole.ADMIN) return { ok: true, user }

  if (user.role === UserRole.STAFF && permission) {
    const perms: string[] = (user as any).customRole?.permissions ?? []
    if (perms.includes(permission)) return { ok: true, user }
  }

  if (allowed.includes(user.role) && !permission) return { ok: true, user }

  return {
    ok: false,
    response: NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 }),
  }
}
