import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { readDemoLeadId } from "@/lib/demo-session"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Admin sections worth attributing. An allowlist rather than "anything that
 * looks like a path", so a crafted request can't fill the table with junk.
 */
const TRACKED_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/payments",
  "/services",
  "/products",
  "/materials",
  "/reports",
  "/promo-codes",
  "/gift-card-orders",
  "/app-settings",
  "/demo-leads",
]

/** Repeat views of the same page inside this window collapse into one row. */
const DEDUPE_WINDOW_MS = 30 * 1000

/**
 * Records a page view against the demo lead that owns this browser.
 *
 * Public, because the demo account is shared and the caller is identified by
 * the signed cookie rather than by a session. Anyone without that cookie —
 * which is every member of staff and every ordinary visitor — is ignored, so
 * the table only ever contains prospects who came through the gate.
 */
export async function POST(request: NextRequest) {
  try {
    // High ceiling: this fires on every navigation, and on this deployment
    // every visitor shares one bucket because nothing sets X-Forwarded-For.
    const rateLimited = checkRateLimit(request, "demo-activity", 300, 15 * 60 * 1000)
    if (rateLimited) return rateLimited

    const leadId = readDemoLeadId(request)
    if (!leadId) return new NextResponse(null, { status: 204 })

    const body = await request.json().catch(() => null)
    const path = typeof body?.path === "string" ? body.path.split("?")[0].slice(0, 200) : null

    if (!path || !TRACKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return new NextResponse(null, { status: 204 })
    }

    // The cookie is signed, but the lead it names could have been deleted.
    const lead = await prisma.demoLead.findUnique({
      where: { id: leadId },
      select: { id: true },
    })
    if (!lead) return new NextResponse(null, { status: 204 })

    // Collapse remounts and quick back-and-forth into a single view. Served by
    // the [leadId, createdAt] index.
    const recent = await prisma.demoActivity.findFirst({
      where: { leadId, createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
      select: { path: true },
    })
    if (recent?.path === path) return new NextResponse(null, { status: 204 })

    await prisma.demoActivity.create({ data: { leadId, path } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // Never surface analytics failures to the page being measured.
    console.error("Demo activity record failed:", error)
    return new NextResponse(null, { status: 204 })
  }
}
