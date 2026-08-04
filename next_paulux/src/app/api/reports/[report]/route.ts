import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { reportRepository } from "@/features/report/server/report.repository"

// slug → aggregation. Matches the report registry / config slugs.
const REPORTS: Record<string, (from: string, to: string) => Promise<any[]>> = {
  revenue: (f, t) => reportRepository.revenue(f, t),
  collections: (f, t) => reportRepository.collections(f, t),
  outstanding: (f, t) => reportRepository.outstanding(f, t),
  "sales-by-service": (f, t) => reportRepository.salesByService(f, t),
  "product-sales": (f, t) => reportRepository.productSales(f, t),
  "staff-performance": (f, t) => reportRepository.staffPerformance(f, t),
  "promo-usage": (f, t) => reportRepository.promoUsage(f, t),
  "gift-cards": (f, t) => reportRepository.giftCards(f, t),
  "material-usage": (f, t) => reportRepository.materialUsage(f, t),
  "stock-movements": (f, t) => reportRepository.stockMovements(f, t),
  bookings: (f, t) => reportRepository.bookings(f, t),
}

const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)

// Defaults to the current month if the range is missing/invalid.
function resolveRange(fromRaw: string | null, toRaw: string | null) {
  if (isDate(fromRaw) && isDate(toRaw)) return { from: fromRaw, to: toRaw }
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ report: string }> }) {
  const auth = await requireRoleApi(["ADMIN"], "reports.view")
  if (!auth.ok) return auth.response

  const { report } = await params
  const handler = REPORTS[report]
  if (!handler) {
    return NextResponse.json({ success: false, message: "Unknown report" }, { status: 404 })
  }

  try {
    const sp = req.nextUrl.searchParams
    const { from, to } = resolveRange(sp.get("from"), sp.get("to"))
    const data = await handler(from, to)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error(`Report "${report}" failed:`, error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to build report" },
      { status: 500 }
    )
  }
}
