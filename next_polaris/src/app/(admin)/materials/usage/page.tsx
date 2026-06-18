import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import UsageReportShell from "@/features/material/components/usage-report-shell"

export const dynamic = "force-dynamic"

export default async function MaterialUsagePage() {
  await requireRole([UserRole.ADMIN], "materials.view")

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <UsageReportShell />
    </div>
  )
}
