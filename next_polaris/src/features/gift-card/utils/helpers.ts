import { randomBytes } from "crypto"

/**
 * Generates a recipient-facing gift card redemption code, e.g. GFT-AB12CD34EF56GH78
 *
 * Uses 16 hex chars (64 bits of entropy, no truncation) — these codes guard real
 * monetary value via a public, unauthenticated redeem endpoint, so they need to
 * resist brute-force guessing.
 */
export function generateGiftCardCode(): string {
  const randomPart = randomBytes(8).toString("hex").toUpperCase()
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
