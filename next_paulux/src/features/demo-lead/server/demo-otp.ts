import { randomInt } from "crypto"
import { prisma } from "@/lib/prisma"
import { hashPassword, comparePassword } from "@/utils/helpers"
import { sendSMS } from "@/lib/arkesal"

/** How long a code stays usable. */
export const OTP_TTL_MS = 10 * 60 * 1000

/** Wrong guesses allowed before the code is burned. */
export const OTP_MAX_ATTEMPTS = 5

/**
 * Codes per number per window. This is the real spend control: every code is
 * a paid SMS, and the IP-based limiter is useless on this deployment because
 * every visitor shares one bucket (no proxy sets X-Forwarded-For).
 */
export const OTP_MAX_PER_PHONE = 3
export const OTP_PHONE_WINDOW_MS = 15 * 60 * 1000

export type IssueResult =
  | { ok: true }
  | { ok: false; reason: "throttled" | "send_failed"; retryAfterSeconds?: number }

/**
 * Issue a code for a lead and text it to them.
 *
 * Any earlier unconsumed code for the number is expired first, so a resend
 * leaves exactly one live code and an old SMS can't be replayed.
 */
export async function issueOtp(leadId: string, phone: string, name: string): Promise<IssueResult> {
  const windowStart = new Date(Date.now() - OTP_PHONE_WINDOW_MS)
  const recent = await prisma.demoOtp.count({
    where: { phone, createdAt: { gte: windowStart } },
  })

  if (recent >= OTP_MAX_PER_PHONE) {
    const oldest = await prisma.demoOtp.findFirst({
      where: { phone, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    })
    const retryAt = (oldest?.createdAt.getTime() ?? Date.now()) + OTP_PHONE_WINDOW_MS
    return {
      ok: false,
      reason: "throttled",
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)),
    }
  }

  // Retire any live code for this number before minting a new one.
  await prisma.demoOtp.updateMany({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  })

  // randomInt is drawn from the CSPRNG, unlike Math.random.
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")

  await prisma.demoOtp.create({
    data: {
      leadId,
      phone,
      codeHash: await hashPassword(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  const firstName = name.trim().split(/\s+/)[0] || "there"
  const result = await sendSMS({
    recipients: [phone],
    message: `Hi ${firstName}, your Paulux demo code is ${code}. It expires in 10 minutes.`,
  })

  if (!result || result.success !== true) {
    return { ok: false, reason: "send_failed" }
  }

  return { ok: true }
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "incorrect" }

/**
 * Check a code and, on success, mark the lead's number verified.
 *
 * Attempts are counted before the comparison so a failed guess always costs
 * the caller something, even if the process dies mid-request.
 */
export async function verifyOtp(leadId: string, code: string): Promise<VerifyResult> {
  const otp = await prisma.demoOtp.findFirst({
    where: { leadId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  })

  if (!otp) return { ok: false, reason: "not_found" }
  if (otp.expiresAt <= new Date()) return { ok: false, reason: "expired" }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" }

  await prisma.demoOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  })

  const matches = await comparePassword(code, otp.codeHash)
  if (!matches) return { ok: false, reason: "incorrect" }

  await prisma.$transaction([
    prisma.demoOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    }),
    prisma.demoLead.update({
      where: { id: leadId },
      data: { phoneVerified: true, verifiedAt: new Date() },
    }),
  ])

  return { ok: true }
}
