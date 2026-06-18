import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import MaterialsClientShell from "@/features/material/components/materials-client-shell"

export const dynamic = "force-dynamic"

export default async function MaterialsPage() {
  await requireRole([UserRole.ADMIN], "materials.view")

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <MaterialsClientShell />
    </div>
  )
}
