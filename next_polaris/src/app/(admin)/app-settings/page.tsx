import { requireRole } from "@/app/_auth/require-role"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import AppSettingsShell from "@/features/style-image/components/app-settings-shell"
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository"
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository"
import { StaffMember } from "@/features/staff/types"
import { PAYMENT_EMAILS_KEY, parseEmailList } from "@/features/payment/server/payment-recipients"

export const dynamic = "force-dynamic"

const WALKIN_EMAIL_DEFAULT = "walkin@polarisbeautylounge.com"

export default async function AppSettingsPage() {
  await requireRole([UserRole.ADMIN], "settings.view")

  const db = prisma as any

  const [images, walkinSetting, paymentEmailsSetting, categories, businessHours, blockedDates, staffRaw, rolesRaw] = await Promise.all([
    prisma.styleImage.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.systemSetting.findUnique({ where: { key: "walkin_email" } }),
    prisma.systemSetting.findUnique({ where: { key: PAYMENT_EMAILS_KEY } }),
    prisma.serviceCategory.findMany({
      include: { _count: { select: { services: true } } },
      orderBy: { createdAt: "asc" },
    }),
    businessHourRepository.getAll(),
    blockedDateRepository.getAll(),
    db.user.findMany({
      where: { role: UserRole.STAFF },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { username: "asc" },
    }),
    db.role.findMany({
      include: { _count: { select: { users: true } } },
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

  const serializedStaff: StaffMember[] = staffRaw.map((s: any) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))

  const serializedRoles = rolesRaw.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    isSystem: r.isSystem,
    userCount: r._count.users,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <AppSettingsShell
        initialImages={serializedImages}
        initialWalkinEmail={walkinSetting?.value ?? WALKIN_EMAIL_DEFAULT}
        initialPaymentEmails={parseEmailList(paymentEmailsSetting?.value)}
        initialCategories={serializedCategories}
        initialBusinessHours={businessHours}
        initialBlockedDates={blockedDates}
        initialStaff={serializedStaff}
        initialRoles={serializedRoles}
      />
    </div>
  )
}
