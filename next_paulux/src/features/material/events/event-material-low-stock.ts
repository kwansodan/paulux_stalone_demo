import { inngest } from "@/lib/inngest"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { sendSMS } from "@/lib/arkesal"
import { sendLowStockAlertEmail } from "@/features/product/emails/send-low-stock-alert-email"

/**
 * Alerts admins when a material runs low or out of stock. Mirrors the product
 * low-stock alert and reuses the same email template.
 */
export const materialLowStockEvent = inngest.createFunction(
  { id: "material-low-stock" },
  { event: "app/material.low-stock" },
  async ({ event, step }) => {
    const { materialName, unit, currentStock, threshold, isOutOfStock } = event.data
    const label = `${materialName} (material)`

    const admins = await step.run("fetch-admins", async () => {
      return prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { email: true, username: true, phone: true },
      })
    })

    if (admins.length === 0) return { status: "no_admins" }

    const adminsWithPhone = admins.filter((a) => a.phone)
    if (adminsWithPhone.length > 0) {
      await step.run("send-sms-alerts", async () => {
        const message = isOutOfStock
          ? `PAULUX ALERT: material "${materialName}" is now OUT OF STOCK. Please restock immediately.`
          : `PAULUX ALERT: material "${materialName}" is running low — ${currentStock} ${unit} left (threshold: ${threshold}). Please restock soon.`

        return sendSMS({
          recipients: adminsWithPhone.map((a) => a.phone!),
          message,
        })
      })
    }

    const emailResults = await step.run("send-email-alerts", async () => {
      const results = await Promise.allSettled(
        admins.map((admin) =>
          sendLowStockAlertEmail(admin.email, label, currentStock, threshold, isOutOfStock)
        )
      )
      return results.map((r, i) => ({ email: admins[i].email, status: r.status }))
    })

    return { materialName, currentStock, isOutOfStock, notified: admins.length, emailResults }
  }
)
