// import { NextResponse } from "next/server"

import { cache } from "react"
import { requireAuth } from "./require-auth"
import { redirect } from "next/navigation"
import { UserRole } from "@generated/prisma/client"

export const requireRole = cache(async (allowedRoles: UserRole[]) => {
  const { user } = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }
  return user
})