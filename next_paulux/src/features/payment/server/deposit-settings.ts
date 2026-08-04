import { prisma } from "@/lib/prisma"
import { BookingWithServiceAndPayment } from "@/features/booking/types"

/**
 * SystemSetting key holding a global minimum-deposit override (GHS). When set,
 * it replaces every per-service/package minDepositFixed on the customer site —
 * a single flat deposit requirement applies to all bookings instead.
 */
export const GLOBAL_MIN_DEPOSIT_KEY = "global_min_deposit"

/** Returns the global deposit override amount, or null if unset/invalid/<=0 (disabled). */
export async function getGlobalMinDeposit(): Promise<number | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: GLOBAL_MIN_DEPOSIT_KEY } })
  if (!setting?.value) return null
  const amount = Number(setting.value)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

/**
 * Resolves the minimum deposit required for a booking: the global override if
 * one is configured, otherwise the package's minDepositFixed (if booked via a
 * package) or the sum of each booked service's minDepositFixed.
 */
export async function getRequiredDeposit(
  booking: Pick<BookingWithServiceAndPayment, "packageId" | "services">
): Promise<number> {
  const globalOverride = await getGlobalMinDeposit()
  if (globalOverride != null) return globalOverride

  if (booking.packageId) {
    const pkg = await prisma.servicePackage.findUnique({ where: { id: booking.packageId } })
    if (pkg) return Number(pkg.minDepositFixed)
  }

  return booking.services.reduce((sum, s) => sum + Number(s.service.minDepositFixed), 0)
}
