import { isAuthenticated } from "./is-authenticated"
import { NextResponse } from "next/server"

export async function requireAuthApi() {
  const { user } = await isAuthenticated()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      )
    }
  }

  return { ok: true, user }
}
