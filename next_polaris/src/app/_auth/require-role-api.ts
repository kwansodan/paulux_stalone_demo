import { UserRole } from "@generated/prisma/client"
import { NextResponse } from "next/server"
import { requireAuthApi } from "./require-auth-api"

export async function requireRoleApi(allowed: UserRole[]) {
  const auth = await requireAuthApi()

  if (!auth.ok || !auth.user) return auth

  if (!allowed.includes(auth.user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "FORBIDDEN" },
        { status: 403 }
      )
    }
  }

  return { ok: true, user: auth.user }
}
