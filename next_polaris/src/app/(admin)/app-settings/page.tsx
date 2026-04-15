import { requireRole } from "@/app/_auth/require-role"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import AppSettingsShell from "@/features/style-image/components/app-settings-shell"

export const dynamic = "force-dynamic"

export default async function AppSettingsPage() {
  await requireRole([UserRole.ADMIN])

  const images = await prisma.styleImage.findMany({
    orderBy: { sortOrder: "asc" },
  })

  const serialized = images.map((img) => ({
    ...img,
    createdAt: img.createdAt.toISOString(),
    updatedAt: img.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="space-y-2 mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">App Settings</h1>
        <p className="text-sm text-gray-500">Manage landing page content and appearance.</p>
      </div>
      <AppSettingsShell initialImages={serialized} />
    </div>
  )
}
