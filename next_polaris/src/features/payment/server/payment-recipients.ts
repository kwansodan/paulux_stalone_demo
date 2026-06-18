import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"

/**
 * SystemSetting key holding the comma/newline-separated list of email
 * addresses that should receive payment notifications.
 */
export const PAYMENT_EMAILS_KEY = "payment_notification_emails"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Parse a free-form list (commas, newlines, semicolons, spaces) into valid, deduped emails. */
export function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const token of raw.split(/[\s,;]+/)) {
    const email = token.trim()
    if (!email) continue
    const lower = email.toLowerCase()
    if (EMAIL_RE.test(email) && !seen.has(lower)) {
      seen.add(lower)
      out.push(email)
    }
  }
  return out
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

export type PaymentRecipient = { email: string; name: string }

/**
 * Resolve who should receive payment notifications.
 *
 * If the `payment_notification_emails` setting has been configured, ONLY those
 * addresses are used (decoupled from admin accounts). If it is empty/unset, we
 * fall back to every ADMIN user — preserving the original behaviour so a fresh
 * install (or a cleared setting) never silently stops notifying anyone.
 */
export async function getPaymentNotificationRecipients(): Promise<PaymentRecipient[]> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: PAYMENT_EMAILS_KEY } })
  const configured = parseEmailList(setting?.value)

  if (configured.length > 0) {
    return configured.map((email) => ({ email, name: email.split("@")[0] }))
  }

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { email: true, username: true },
  })
  return admins.map((a) => ({ email: a.email, name: a.username }))
}
