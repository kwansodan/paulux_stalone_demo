import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { DemoAccessSchema } from "@/features/demo-lead/utils/validation"
import { getDemoLeadRecipients } from "@/features/demo-lead/server/demo-lead-recipients"
import { sendDemoLeadEmail } from "@/features/demo-lead/emails/send-demo-lead-email"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Public endpoint — deliberately unauthenticated, unlike every other route
 * under /api. It is the front door of the demo: a prospect leaves their
 * details and gets the shared demo credentials back.
 */
export async function POST(request: NextRequest) {
  try {
    // NOTE: getClientIp falls back to the literal "unknown" when there is no
    // x-forwarded-for/x-real-ip header. This demo is published straight on a
    // host port with no reverse proxy in front, so every visitor currently
    // lands in the SAME bucket. The limit is therefore deliberately loose —
    // it exists to stop a script hammering the endpoint, not to police
    // individuals, and a tight number here would lock out real prospects.
    // Put a proxy in front that sets X-Forwarded-For and this becomes per-IP.
    const rateLimited = checkRateLimit(request, "demo-access", 20, 15 * 60 * 1000)
    if (rateLimited) return rateLimited

    const body = await request.json()
    const parsed = DemoAccessSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid submission" },
        { status: 400 }
      )
    }

    const { name, email, business, phone, message, website } = parsed.data

    // Honeypot: the field is hidden from real users, so a value means a bot.
    if (website) {
      return NextResponse.json({ success: false, message: "Invalid submission" }, { status: 400 })
    }

    const lead = await prisma.demoLead.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        business: business?.trim() || null,
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    })

    // Notification is best-effort. The lead is already persisted, and a Resend
    // outage must not stop the prospect getting into the demo — that would turn
    // an email problem into a lost prospect.
    try {
      const recipients = await getDemoLeadRecipients()
      if (recipients.length > 0) {
        await sendDemoLeadEmail({
          to: recipients.map((r) => r.email),
          name: lead.name,
          email: lead.email,
          business: lead.business,
          phone: lead.phone,
          message: lead.message,
          requestedAt: lead.createdAt,
        })
      }
    } catch (error) {
      console.error("Demo lead notification failed (lead was still saved):", error)
    }

    // Server-side only: these are never NEXT_PUBLIC_, so they exist in the
    // client bundle nowhere — they reach the browser only in this response.
    const demoEmail = process.env.DEMO_LOGIN_EMAIL
    const demoPassword = process.env.DEMO_LOGIN_PASSWORD

    return NextResponse.json({
      success: true,
      data: {
        credentials:
          demoEmail && demoPassword
            ? { email: demoEmail, password: demoPassword }
            : null,
      },
    })
  } catch (error: any) {
    console.error("Demo access request failed:", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
