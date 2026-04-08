'use server'

import { SESSION_COOKIE_NAME } from "@/constants"
import { cookies } from "next/headers"
import { cache } from "react"
import { authRepository } from "@/features/auth/server/auth.repository"


export const isAuthenticated = cache(async () => {

  const cookieStore = await cookies()

  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null

  if (!sessionToken) {
    return {
      user: null,
      session: null
    }
  }

  return authRepository.validateSession(sessionToken)
})