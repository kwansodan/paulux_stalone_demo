import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import { notFound } from "next/navigation"
import { getReport } from "@/features/report/registry"
import ReportRouter from "@/features/report/components/report-router"

export const dynamic = "force-dynamic"

export default async function ReportSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole([UserRole.ADMIN], "reports.view")

  const { slug } = await params
  if (!getReport(slug)) notFound()

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <ReportRouter slug={slug} />
    </div>
  )
}
