import { inngest } from "@/lib/inngest"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import { sendSMS } from "@/lib/arkesal"
import { sendLowStockAlertEmail } from "../emails/send-low-stock-alert-email"

export const productLowStockEvent = inngest.createFunction(
  { id: "product-low-stock" },
  { event: "app/product.low-stock" },
  async ({ event, step }) => {
    const { productName, currentStock, threshold, isOutOfStock } = event.data

    const admins = await step.run("fetch-admins", async () => {
      return prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { email: true, username: true, phone: true },
      })
    })

    if (admins.length === 0) return { status: "no_admins" }

    // Send SMS to all admins with a phone number
    const adminsWithPhone = admins.filter(a => a.phone)
    if (adminsWithPhone.length > 0) {
      await step.run("send-sms-alerts", async () => {
        const message = isOutOfStock
          ? `PAULUX ALERT: "${productName}" is now OUT OF STOCK. Please restock immediately.`
          : `PAULUX ALERT: "${productName}" is running low — ${currentStock} unit${currentStock === 1 ? "" : "s"} left (threshold: ${threshold}). Please restock soon.`

        return sendSMS({
          recipients: adminsWithPhone.map(a => a.phone!),
          message,
        })
      })
    }

    // Send email to all admins
    const emailResults = await step.run("send-email-alerts", async () => {
      const results = await Promise.allSettled(
        admins.map(admin =>
          sendLowStockAlertEmail(admin.email, productName, currentStock, threshold, isOutOfStock)
        )
      )
      return results.map((r, i) => ({
        email: admins[i].email,
        status: r.status,
      }))
    })

    return {
      productName,
      currentStock,
      isOutOfStock,
      notified: admins.length,
      emailResults,
    }
  }
)
