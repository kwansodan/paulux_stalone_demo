export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import MetricsGrid from "@/components/dashboard/dashboard-metric-grid"
import ScheduleList from "@/components/dashboard/schedule-list"
import RevenueBreakdown from "@/components/dashboard/revenue-breakdown"
import DashboardExtendedStats from "@/components/dashboard/dashboard-extended-stats"
import OutOfStockPanel from "@/components/dashboard/out-of-stock-panel"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { prisma } from "@/lib/prisma"
import { PaymentProvider, PaymentStatus, UserRole } from "@generated/prisma/client"

function fmt(d: Date) {
  return d.toISOString().split("T")[0]
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  await requireRole([UserRole.ADMIN])

  const { from: fromParam, to: toParam } = await searchParams

  const todayStr = fmt(new Date())
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  const fromStr = fromParam && dateRegex.test(fromParam) ? fromParam : todayStr
  const toStr   = toParam   && dateRegex.test(toParam)   ? toParam   : todayStr

  const fromDate = new Date(fromStr + "T00:00:00")
  const toDateEnd = new Date(toStr + "T00:00:00")
  toDateEnd.setDate(toDateEnd.getDate() + 1)

  const now = new Date()

  const [
    { bookings, count, revenue },
    receivedPayments,
    bookedServices,
    promoCodes,
    partialCount,
    refundedCount,
    outOfStockProducts,
    allActiveProducts,
    preBookingResult,
  ] = await Promise.all([
    bookingRepository.getAllBookings(
      { bookingDate: { gte: fromStr, lte: toStr } },
      { includeCount: true, includeRevenue: true }
    ),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: fromDate, lt: toDateEnd },
      },
      select: {
        id: true,
        amount: true,
        provider: true,
        rawPayload: true,
      },
    }),
    prisma.bookingService.findMany({
      where: {
        booking: {
          createdAt: { gte: fromDate, lt: toDateEnd },
          status: { not: "CANCELLED" },
        },
      },
      select: { priceAtBooking: true, quantity: true },
    }),
    prisma.promoCode.findMany({
      select: { isActive: true, expiresAt: true, maxUses: true, usedCount: true },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.PARTIAL, createdAt: { gte: fromDate, lt: toDateEnd } },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.REFUNDED, createdAt: { gte: fromDate, lt: toDateEnd } },
    }),
    // Out-of-stock and low-stock products (all-time, not date-filtered)
    prisma.product.findMany({
      where: { isActive: true, stockQuantity: { lte: 0 } } as any,
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true, category: { select: { name: true } } } as any,
      orderBy: { name: "asc" },
    }) as Promise<any[]>,
    prisma.product.findMany({
      where: { isActive: true, stockQuantity: { gt: 0 } } as any,
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true, category: { select: { name: true } } } as any,
    }) as Promise<any[]>,
    // Payments received in the period for bookings scheduled AFTER the period (pre-payments)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: fromDate, lt: toDateEnd },
        booking: { bookingDate: { gt: toStr } },
      },
    }),
  ])

  // Metric counts
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  const completed = bookings.filter(b => b.status === "COMPLETED").length
  const activeCount = (count ?? bookings.length) - cancelled

  // Fetch manual method names for the payments in the period
  type MethodNameRow = { payment_id: string; method_name: string | null }
  let manualMethodNames: MethodNameRow[] = []
  try {
    manualMethodNames = await prisma.$queryRaw<MethodNameRow[]>`
      SELECT p.id AS payment_id, mpm.name AS method_name
      FROM payments p
      LEFT JOIN manual_payment_methods mpm ON p.manual_method_id = mpm.id
      WHERE p.provider = 'MANUAL'
        AND p.status = 'PAID'
        AND p.created_at >= ${fromDate}
        AND p.created_at < ${toDateEnd}
    `
  } catch { /* manual_payment_methods table may not exist in older deployments */ }

  const manualNameById = new Map(manualMethodNames.map(r => [r.payment_id, r.method_name ?? "Cash"]))

  // Dynamic payment method breakdown
  const methodTotals = new Map<string, number>()
  for (const p of receivedPayments) {
    const amount = Number(p.amount)
    if (p.provider === PaymentProvider.MANUAL) {
      const name = manualNameById.get((p as any).id) ?? "Cash"
      methodTotals.set(name, (methodTotals.get(name) ?? 0) + amount)
    } else {
      const channel = (p.rawPayload as any)?.data?.channel ?? "mobile_money"
      const label = channel === "card" ? "Bank Card" : "Mobile Money"
      methodTotals.set(label, (methodTotals.get(label) ?? 0) + amount)
    }
  }
  const methodBreakdown = Array.from(methodTotals.entries()).map(([label, amount]) => ({ label, amount }))
  const netReceived = methodBreakdown.reduce((s, m) => s + m.amount, 0)

  // Discounts applied on bookings in the range
  const discounts = bookings.reduce(
    (sum, b) => sum + (b.discountAmount ? Number(b.discountAmount) : 0),
    0
  )

  // Value of new bookings created within the range
  const bookedTodayValue = bookedServices.reduce(
    (sum, s) => sum + Number(s.priceAtBooking) * (s.quantity ?? 1),
    0
  )

  // Promo code stats (all-time)
  const activePromos = promoCodes.filter(p =>
    p.isActive &&
    (p.expiresAt === null || p.expiresAt > now) &&
    (p.maxUses === null || p.usedCount < p.maxUses)
  ).length
  const expiredPromos = promoCodes.filter(p =>
    !p.isActive ||
    (p.expiresAt !== null && p.expiresAt <= now) ||
    (p.maxUses !== null && p.usedCount >= p.maxUses)
  ).length
  const totalPromoUses = promoCodes.reduce((sum, p) => sum + p.usedCount, 0)

  const preBookingReceived = Number(preBookingResult._sum.amount ?? 0)

  // Products with stock > 0 but at or below threshold
  const lowStockProducts = allActiveProducts.filter(
    p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full space-y-6">

      <DashboardHeader />

      <MetricsGrid
        todaysCount={activeCount}
        pending={pending}
        confirmed={confirmed}
        cancelled={cancelled}
        revenue={revenue ?? 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueBreakdown
          methodBreakdown={methodBreakdown}
          discounts={discounts}
          bookedTodayValue={bookedTodayValue}
          netReceived={netReceived}
          revenue={revenue ?? 0}
          preBookingReceived={preBookingReceived}
        />
        <ScheduleList bookings={bookings} />
      </div>

      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <OutOfStockPanel
          outOfStock={outOfStockProducts}
          lowStock={lowStockProducts}
        />
      )}

      <DashboardExtendedStats
        activePromos={activePromos}
        expiredPromos={expiredPromos}
        totalPromoUses={totalPromoUses}
        partialPayments={partialCount}
        refundedPayments={refundedCount}
        completedBookings={completed}
      />

    </div>
  )
}
