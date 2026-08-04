import { prisma } from "@/lib/prisma"

/**
 * SystemSetting key holding the Paystack processing-fee rate as a decimal
 * fraction (e.g. 0.0195 = 1.95%). Passed on to the customer as a surcharge.
 */
export const PROCESSING_FEE_RATE_KEY = "processing_fee_rate"

/** Paystack's standard local rate — used when the setting is unset/invalid. */
export const DEFAULT_PROCESSING_FEE_RATE = 0.0195

/** Returns the configured fee rate, clamped to [0, 0.5). Falls back to the default. */
export async function getProcessingFeeRate(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: PROCESSING_FEE_RATE_KEY } })
  const rate = setting?.value ? Number(setting.value) : NaN
  if (!Number.isFinite(rate) || rate < 0 || rate >= 0.5) return DEFAULT_PROCESSING_FEE_RATE
  return rate
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Grosses up a service amount so that, after Paystack deducts `rate` of the total
 * charged, the salon nets `amount` exactly.
 *
 *   charge = amount / (1 - rate)   → net = charge * (1 - rate) = amount
 *   fee    = charge - amount
 *
 * Both are rounded to 2dp (net may differ by ≤1 pesewa). A zero rate is a no-op.
 */
export function grossUp(amount: number, rate: number): { charge: number; fee: number } {
  if (!Number.isFinite(amount) || amount <= 0 || rate <= 0) {
    return { charge: round2(Math.max(0, amount)), fee: 0 }
  }
  const charge = round2(amount / (1 - rate))
  return { charge, fee: round2(charge - amount) }
}
