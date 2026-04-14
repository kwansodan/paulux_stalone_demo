import { requireRole } from "@/app/_auth/require-role"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import ServiceCategoriesShell from "@/features/service-category/components/service-categories-shell"

export const dynamic = "force-dynamic"

export default async function ServiceCategoriesPage() {
  await requireRole([UserRole.ADMIN])

  const categories = await prisma.serviceCategory.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: { createdAt: "asc" },
  })

  const serialized = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <ServiceCategoriesShell initialCategories={serialized} />
    </div>
  )
}
