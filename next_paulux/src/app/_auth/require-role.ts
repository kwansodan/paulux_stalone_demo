// import { NextResponse } from "next/server"

import { cache } from "react"
import { requireAuth } from "./require-auth"
import { redirect } from "next/navigation"
import { UserRole } from "@generated/prisma/client"
import { PermissionKey } from "@/lib/permissions"

export const requireRole = cache(async (allowedRoles: UserRole[], permission?: PermissionKey) => {
  const { user } = await requireAuth()

  // SUPER_ADMIN always passes (cast: local client is stale until db push)
  if ((user.role as string) === "SUPER_ADMIN" || user.role === UserRole.ADMIN) return user

  // STAFF: must have the permission via their custom role
  if (user.role === UserRole.STAFF && permission) {
    const perms: string[] = (user as any).customRole?.permissions ?? []
    if (perms.includes(permission)) return user
  }

  // Legacy: explicit role match with no permission gating
  if (allowedRoles.includes(user.role) && !permission) return user

  redirect('/unauthorized')
})