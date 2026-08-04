import LowStockAlertEmail from "@/emails/product/low-stock-alert-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

export const sendLowStockAlertEmail = async (
  adminEmail: string,
  productName: string,
  currentStock: number,
  threshold: number,
  isOutOfStock: boolean,
) => {
  const subject = isOutOfStock
    ? `⚠️ Out of Stock: ${productName}`
    : `⚠️ Low Stock Alert: ${productName}`

  return resend.emails.send({
    from: EMAIL_FROM,
    to: adminEmail,
    subject,
    react: (
      <LowStockAlertEmail
        productName={productName}
        currentStock={currentStock}
        threshold={threshold}
        isOutOfStock={isOutOfStock}
      />
    ),
  })
}
