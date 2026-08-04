import { prisma } from "@/lib/prisma"

/**
 * SystemSetting keys holding admin-customised display names for the two payment
 * gateways. These are DISPLAY-ONLY — all routing/payment logic keys off the
 * PaymentProvider enum (PRIMARY_PAYSTACK / SECONDARY_PAYSTACK), never these strings.
 */
export const GATEWAY_LABEL_PRIMARY_KEY = "gateway_label_primary"
export const GATEWAY_LABEL_SECONDARY_KEY = "gateway_label_secondary"

export const DEFAULT_GATEWAY_LABEL_PRIMARY = "Primary Paystack"
export const DEFAULT_GATEWAY_LABEL_SECONDARY = "Secondary Paystack"

export const MAX_GATEWAY_LABEL_LENGTH = 40

export type GatewayLabels = { primary: string; secondary: string }

/**
 * Returns the configured gateway display names, falling back to the defaults
 * when unset or blank.
 */
export async function getGatewayLabels(): Promise<GatewayLabels> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: [GATEWAY_LABEL_PRIMARY_KEY, GATEWAY_LABEL_SECONDARY_KEY] } },
  })

  const byKey = new Map(settings.map((s) => [s.key, s.value]))
  const clean = (v: string | undefined, fallback: string) => {
    const trimmed = (v ?? "").trim()
    return trimmed.length > 0 ? trimmed : fallback
  }

  return {
    primary: clean(byKey.get(GATEWAY_LABEL_PRIMARY_KEY), DEFAULT_GATEWAY_LABEL_PRIMARY),
    secondary: clean(byKey.get(GATEWAY_LABEL_SECONDARY_KEY), DEFAULT_GATEWAY_LABEL_SECONDARY),
  }
}
