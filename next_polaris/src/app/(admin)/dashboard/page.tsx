export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import DashboardKpis from "@/components/dashboard/dashboard-kpis"
import StockAlertBar from "@/components/dashboard/stock-alert-bar"
import ScheduleList from "@/components/dashboard/schedule-list"
import RevenueBreakdown from "@/components/dashboard/revenue-breakdown"
import BookingStatusPanel from "@/components/dashboard/booking-status-panel"
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
  await requireRole([UserRole.ADMIN], "dashboard.view")

  const { from: fromParam, to: toParam } = await searchParams

  const todayStr = fmt(new Date())
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  const fromStr = fromParam && dateRegex.test(fromParam) ? fromParam : todayStr
  const toStr   = toParam   && dateRegex.test(toParam)   ? toParam   : todayStr

  const fromDate = new Date(fromStr + "T00:00:00")
  const toDateEnd = new Date(toStr + "T00:00:00")
  toDateEnd.setDate(toDateEnd.getDate() + 1)

  const [
    { bookings, count, revenue },
    receivedPayments,
    partialCount,
    refundedCount,
    outOfStockProducts,
    allActiveProducts,
    preBookingResult,
    previouslyCollectedResult,
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
    prisma.payment.count({
      where: { status: PaymentStatus.PARTIAL, createdAt: { gte: fromDate, lt: toDateEnd } },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.REFUNDED, createdAt: { gte: fromDate, lt: toDateEnd } },
    }),
    prisma.product.findMany({
      where: { isActive: true, trackStock: true, stockQuantity: { lte: 0 } } as any,
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true } as any,
      orderBy: { name: "asc" },
    }) as Promise<any[]>,
    prisma.product.findMany({
      where: { isActive: true, trackStock: true, stockQuantity: { gt: 0 } } as any,
      select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true } as any,
    }) as Promise<any[]>,
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: fromDate, lt: toDateEnd },
        booking: { bookingDate: { gt: toStr } },
      },
    }),
    // Payments received before this period for bookings due within this period
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID,
        createdAt: { lt: fromDate },
        booking: { bookingDate: { gte: fromStr, lte: toStr } },
      },
    }),
  ])

  // Booking status counts
  const pending   = bookings.filter(b => b.status === "PENDING").length
  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length
  const completed = bookings.filter(b => b.status === "COMPLETED").length

  // Payment method breakdown
  type MethodNameRow = { payment_id: string; method_name: string | null }
  let manualMethodNames: MethodNameRow[] = []
  try {
    manualMethodNames = await prisma.$queryRaw<MethodNameRow[]>`
      SELECT p.id AS payment_id, mpm.name AS method_name
      FROM payments p
      LEFT JOIN manual_payment_methods mpm ON p."manualMethodId" = mpm.id
      WHERE p.provider = 'MANUAL'
        AND p.status = 'PAID'
        AND p."createdAt" >= ${fromDate}
        AND p."createdAt" < ${toDateEnd}
    `
  } catch { /* manual_payment_methods table may not exist in older deployments */ }

  const manualNameById = new Map(manualMethodNames.map(r => [r.payment_id, r.method_name ?? "Cash"]))

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

  const discounts = bookings.reduce(
    (sum, b) => sum + (b.discountAmount ? Number(b.discountAmount) : 0),
    0
  )

  const preBookingReceived = Number(preBookingResult._sum.amount ?? 0)
  const previouslyCollected = Number(previouslyCollectedResult._sum.amount ?? 0)
  const periodRevenue = revenue ?? 0
  const lowStockProducts = allActiveProducts.filter(
    p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
  )

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full space-y-5">

      <DashboardHeader />

      <StockAlertBar
        outOfStockCount={outOfStockProducts.length}
        lowStockCount={lowStockProducts.length}
      />

      <DashboardKpis
        bookingsCount={count ?? bookings.length}
        revenue={periodRevenue}
        netCollected={netReceived}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <ScheduleList bookings={bookings} />
        </div>
        <div className="lg:col-span-2">
          <BookingStatusPanel
            pending={pending}
            confirmed={confirmed}
            completed={completed}
            cancelled={cancelled}
            partialPayments={partialCount}
            refundedPayments={refundedCount}
          />
        </div>
      </div>

      <RevenueBreakdown
        methodBreakdown={methodBreakdown}
        discounts={discounts}
        netReceived={netReceived}
        revenue={periodRevenue}
        preBookingReceived={preBookingReceived}
        previouslyCollected={previouslyCollected}
      />

    </div>
  )
}
