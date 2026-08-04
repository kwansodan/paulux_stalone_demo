import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { DemoAccessSchema } from "@/features/demo-lead/utils/validation"
import { issueOtp } from "@/features/demo-lead/server/demo-otp"
import { normalizePhone } from "@/lib/phone"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Step 1 of the demo gate — deliberately unauthenticated, unlike every other
 * route under /api. Records the lead as unverified and texts them a code.
 * No credentials are handed out here; that happens in ./verify once the
 * number has been proven.
 */
export async function POST(request: NextRequest) {
  try {
    // NOTE: getClientIp falls back to the literal "unknown" when there is no
    // x-forwarded-for/x-real-ip header. This demo is published straight on a
    // host port with no reverse proxy, so every visitor currently shares ONE
    // bucket. This limit is therefore only a blunt stop on a script hammering
    // the endpoint; the meaningful per-number throttle (and the one that
    // controls SMS spend) lives in issueOtp.
    const rateLimited = checkRateLimit(request, "demo-access", 30, 15 * 60 * 1000)
    if (rateLimited) return rateLimited

    const body = await request.json()
    const parsed = DemoAccessSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid submission" },
        { status: 400 }
      )
    }

    const { name, phone, email, business, message, website } = parsed.data

    // Honeypot: the field is hidden from real users, so a value means a bot.
    if (website) {
      return NextResponse.json({ success: false, message: "Invalid submission" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const lead = await prisma.demoLead.create({
      data: {
        name: name.trim(),
        phone: normalizedPhone,
        email: email?.trim() ? email.toLowerCase().trim() : null,
        business: business?.trim() || null,
        message: message?.trim() || null,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    })

    const issued = await issueOtp(lead.id, normalizedPhone, lead.name)

    if (!issued.ok) {
      if (issued.reason === "throttled") {
        return NextResponse.json(
          {
            success: false,
            message: "Too many codes requested for this number. Please try again shortly.",
          },
          {
            status: 429,
            headers: issued.retryAfterSeconds
              ? { "Retry-After": String(issued.retryAfterSeconds) }
              : undefined,
          }
        )
      }

      return NextResponse.json(
        { success: false, message: "We couldn't send the code. Please check the number and try again." },
        { status: 502 }
      )
    }

    // Only the lead id goes back — it is a random uuid and useless without the
    // code that was sent to the handset.
    return NextResponse.json({ success: true, data: { leadId: lead.id } })
  } catch (error: any) {
    console.error("Demo access request failed:", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
