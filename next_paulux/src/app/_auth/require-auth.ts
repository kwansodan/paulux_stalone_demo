'use server'

import { cache } from "react"
import { isAuthenticated } from "./is-authenticated"
import { redirect } from "next/navigation"

export const requireAuth = cache(async () => {
  const { user, session } = await isAuthenticated()
  if (!user) redirect('/login')
  return { user, session }
})