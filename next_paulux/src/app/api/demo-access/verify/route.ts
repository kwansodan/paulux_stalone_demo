import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { DemoVerifySchema } from "@/features/demo-lead/utils/validation"
import { verifyOtp } from "@/features/demo-lead/server/demo-otp"
import { getDemoLeadRecipients } from "@/features/demo-lead/server/demo-lead-recipients"
import { sendDemoLeadEmail } from "@/features/demo-lead/emails/send-demo-lead-email"
import { type NextRequest, NextResponse } from "next/server"

const FAILURE_MESSAGES: Record<string, string> = {
  not_found: "That code has expired. Please request a new one.",
  expired: "That code has expired. Please request a new one.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
  incorrect: "That code isn't right. Please check and try again.",
}

/**
 * Step 2 of the demo gate. A correct code proves the number, which is the
 * whole point of the exercise — an unverified lead is just a typed string.
 * Only here are the demo credentials released.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = checkRateLimit(request, "demo-verify", 60, 15 * 60 * 1000)
    if (rateLimited) return rateLimited

    const body = await request.json()
    const parsed = DemoVerifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid code" },
        { status: 400 }
      )
    }

    const { leadId, code } = parsed.data
    const result = await verifyOtp(leadId, code)

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: FAILURE_MESSAGES[result.reason] ?? "Verification failed." },
        { status: 400 }
      )
    }

    const lead = await prisma.demoLead.findUnique({ where: { id: leadId } })

    // Notify only now: a lead is worth telling you about once the number is
    // real. Best-effort — the lead is already saved and verified, so an email
    // outage must not cost the prospect their access.
    if (lead) {
      try {
        const recipients = await getDemoLeadRecipients()
        if (recipients.length > 0) {
          await sendDemoLeadEmail({
            to: recipients.map((r) => r.email),
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            business: lead.business,
            message: lead.message,
            requestedAt: lead.createdAt,
          })
        }
      } catch (error) {
        console.error("Demo lead notification failed (lead was still saved):", error)
      }
    }

    // Server-side only: these are never NEXT_PUBLIC_, so they exist in the
    // client bundle nowhere — they reach the browser only in this response,
    // and only after the number has been verified.
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
    console.error("Demo verification failed:", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
