'use server'

import { SESSION_COOKIE_NAME } from "@/constants"
import { cookies } from "next/headers"
import { cache } from "react"
import { authRepository } from "@/features/auth/server/auth.repository"


export const isAuthenticated = cache(async () => {

  const cookieStore = await cookies()

  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null

  console.log('[AUTH] Cookie check - sessionToken present:', !!sessionToken)
  console.log('[AUTH] All cookies:', cookieStore.getAll().map(c => c.name))

  if (!sessionToken) {
    console.log('[AUTH] No session token found, returning null user')
    return {
      user: null,
      session: null
    }
  }

  console.log('[AUTH] Validating session token...')
  const result = await authRepository.validateSession(sessionToken)
  console.log('[AUTH] Validation result - user found:', !!result.user)

  return result
})