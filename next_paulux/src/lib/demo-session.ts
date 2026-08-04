import { createHmac, timingSafeEqual } from "crypto"
import type { NextRequest, NextResponse } from "next/server"

/**
 * Ties a browser to the demo lead that verified its phone number.
 *
 * Every prospect signs in to the SAME demo account, so server sessions can't
 * tell them apart. The OTP step is the one moment we know exactly who is at
 * the keyboard, so that is where this cookie gets set — everything the browser
 * does afterwards can then be attributed to that lead.
 *
 * The value is signed rather than a bare id: without a signature a prospect
 * could edit the cookie and file their clicks under someone else's lead.
 */

export const DEMO_LEAD_COOKIE = "demo_lead"

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function secret(): string | null {
  // Reuses the app's existing signing secret rather than introducing another
  // one to configure. No secret means no attribution — never a broken cookie.
  return process.env.NEXTAUTH_SECRET || null
}

function sign(leadId: string, key: string): string {
  return createHmac("sha256", key).update(leadId).digest("hex")
}

/** Attach the attribution cookie to a response. No-ops when unconfigured. */
export function setDemoLeadCookie(response: NextResponse, leadId: string): void {
  const key = secret()
  if (!key) return

  response.cookies.set({
    name: DEMO_LEAD_COOKIE,
    value: `${leadId}.${sign(leadId, key)}`,
    httpOnly: true,
    sameSite: "lax",
    // Matches features/auth/utils/cookie.ts. Marking this Secure while the
    // demo is served over plain HTTP would make the browser drop it, and the
    // symptom would be silently empty analytics.
    secure: process.env.SECURE_COOKIES !== "false",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

/**
 * The lead this browser belongs to, or null.
 *
 * Null is the ordinary case — staff and public visitors never went through the
 * gate — so a missing or invalid cookie returns null rather than throwing.
 */
export function readDemoLeadId(request: NextRequest): string | null {
  const key = secret()
  if (!key) return null

  const raw = request.cookies.get(DEMO_LEAD_COOKIE)?.value
  if (!raw) return null

  const separator = raw.lastIndexOf(".")
  if (separator <= 0) return null

  const leadId = raw.slice(0, separator)
  const provided = raw.slice(separator + 1)
  const expected = sign(leadId, key)

  // Both are hex of the same length, so a length check is enough to keep
  // timingSafeEqual from throwing on mismatched buffers.
  if (provided.length !== expected.length) return null

  try {
    if (!timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"))) {
      return null
    }
  } catch {
    return null
  }

  return leadId
}
