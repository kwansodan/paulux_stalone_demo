import { requireRole } from "@/app/_auth/require-role"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import AppSettingsShell from "@/features/style-image/components/app-settings-shell"

export const dynamic = "force-dynamic"

const WALKIN_EMAIL_DEFAULT = "walkin@polarisbeautylounge.com"

export default async function AppSettingsPage() {
  await requireRole([UserRole.ADMIN])

  const [images, walkinSetting, categories] = await Promise.all([
    prisma.styleImage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.systemSetting.findUnique({ where: { key: "walkin_email" } }),
    prisma.serviceCategory.findMany({
      include: { _count: { select: { services: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const serializedImages = images.map((img) => ({
    ...img,
    createdAt: img.createdAt.toISOString(),
    updatedAt: img.updatedAt.toISOString(),
  }))

  const serializedCategories = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <AppSettingsShell
        initialImages={serializedImages}
        initialWalkinEmail={walkinSetting?.value ?? WALKIN_EMAIL_DEFAULT}
        initialCategories={serializedCategories}
      />
    </div>
  )
}
