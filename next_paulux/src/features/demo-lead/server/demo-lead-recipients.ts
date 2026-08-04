import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { parseEmailList } from "@/features/payment/server/payment-recipients"

/**
 * SystemSetting key holding the comma/newline-separated list of addresses that
 * should be told about new demo leads.
 */
export const DEMO_LEAD_EMAILS_KEY = "demo_lead_emails"

export type DemoLeadRecipient = { email: string; name: string }

/**
 * Resolve who hears about a new demo lead.
 *
 * Mirrors getPaymentNotificationRecipients: an explicit setting wins, and when
 * it is unset we fall back to every ADMIN so a fresh deployment never silently
 * drops leads on the floor. Reuses that module's parseEmailList rather than
 * repeating the parsing rules.
 */
export async function getDemoLeadRecipients(): Promise<DemoLeadRecipient[]> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: DEMO_LEAD_EMAILS_KEY },
  })
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
