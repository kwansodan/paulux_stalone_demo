import { requireRole } from "@/app/_auth/require-role"
import DemoLeadsShell from "@/features/demo-lead/components/demo-leads-shell"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"

export const dynamic = "force-dynamic"

export default async function DemoLeadsPage() {
  await requireRole([UserRole.ADMIN], "demo_leads.view")

  const [leads, unverifiedCount] = await Promise.all([
    prisma.demoLead.findMany({
      where: { phoneVerified: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { activities: true } },
        // Enough to show what they cared about and when they were last around,
        // without dragging every row of a long session into the page.
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
          select: { path: true, createdAt: true },
        },
      },
    }),
    // Requested a code but never entered it — the drop-off is itself a signal.
    prisma.demoLead.count({ where: { phoneVerified: false } }),
  ])

  const serialized = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    business: l.business,
    message: l.message,
    createdAt: l.createdAt.toISOString(),
    verifiedAt: l.verifiedAt?.toISOString() ?? null,
    viewCount: l._count.activities,
    lastSeenAt: l.activities[0]?.createdAt.toISOString() ?? null,
    recentPaths: l.activities.map((a) => a.path),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Demo Leads</h1>
          <p className="text-sm sm:text-[16px] text-gray-600">
            People who verified a mobile number to get into the demo, and what they looked at
          </p>
        </div>
        <DemoLeadsShell leads={serialized} unverifiedCount={unverifiedCount} />
      </div>
    </div>
  )
}
