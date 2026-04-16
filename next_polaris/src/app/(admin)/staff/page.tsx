import { requireRole } from "@/app/_auth/require-role"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"
import StaffShell from "@/features/staff/components/staff-shell"
import { StaffMember } from "@/features/staff/types"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  await requireRole([UserRole.ADMIN])

  const staff = await prisma.user.findMany({
    where: { role: UserRole.STAFF },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { username: "asc" },
  })

  const serialized: StaffMember[] = staff.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="space-y-2 mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Staff</h1>
        <p className="text-sm text-gray-500">
          Manage your stylists and assign them to bookings.
        </p>
      </div>
      <StaffShell initialStaff={serialized} />
    </div>
  )
}
