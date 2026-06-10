import { randomBytes } from "crypto"

/**
 * Generates a recipient-facing gift card redemption code, e.g. GFT-AB12CD34
 */
export function generateGiftCardCode(): string {
  const randomPart = randomBytes(5).toString("hex").slice(0, 8).toUpperCase()
  return `GFT-${randomPart}`
}

/**
 * Generates a unique payment reference for the gift card purchase transaction.
 */
export function generateGiftCardPaymentReference(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const randomPart = randomBytes(4).toString("hex").slice(0, 6).toUpperCase()
  return `GFTPAY-${datePart}-${randomPart}`
}
