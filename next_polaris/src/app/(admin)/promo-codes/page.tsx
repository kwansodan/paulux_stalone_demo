import { requireRole } from "@/app/_auth/require-role"
import PromoCodesShell from "@/features/promo-code/components/promo-codes-shell"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@generated/prisma/client"

export const dynamic = "force-dynamic"

export default async function PromoCodesPage() {
  await requireRole([UserRole.ADMIN])

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  })

  const serialized = codes.map((c) => ({
    ...c,
    discountValue: c.discountValue.toString(),
    minBookingAmount: c.minBookingAmount?.toString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Promo Codes</h1>
          <p className="text-sm sm:text-[16px] text-gray-600">Manage discount codes for customer bookings</p>
        </div>
        <PromoCodesShell initialCodes={serialized} />
      </div>
    </div>
  )
}
