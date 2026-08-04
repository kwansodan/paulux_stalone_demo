/**
 * The `from` address for every outbound email.
 *
 * Resend refuses to send from a domain that has not been verified in the
 * account, so this has to match a verified sender or nothing is delivered —
 * silently, from the caller's point of view. Keeping it in one env-backed
 * constant means a deployment can point at whatever it has verified without
 * editing eleven call sites.
 *
 * `onboarding@resend.dev` is Resend's shared sender: it needs no verification
 * but will only deliver to the Resend account owner's own address. That is
 * enough for a demo whose notifications go to the operator, and not enough for
 * anything customer-facing.
 */
export const EMAIL_FROM = process.env.RESEND_FROM || "no-reply@pauluxbooking.com"
