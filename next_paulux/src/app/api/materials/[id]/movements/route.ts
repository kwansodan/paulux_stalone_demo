import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { materialRepository } from "@/features/material/server/material.repository"
import { MaterialMovementSchema } from "@/features/material/utils/validation"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi(["ADMIN"], "materials.view")
  if (!auth.ok) return auth.response

  const { id } = await params
  const movements = await materialRepository.getMovements(id)
  return NextResponse.json({ success: true, data: movements })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi(["ADMIN"], "materials.manage")
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const parsed = MaterialMovementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: (parsed.error.issues ?? [])[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const before = await prisma.material.findUnique({
    where: { id },
    select: { name: true, unit: true, stockQuantity: true, lowStockThreshold: true, trackStock: true },
  })
  if (!before) {
    return NextResponse.json({ success: false, message: "Material not found" }, { status: 404 })
  }

  const userId = (auth as any).user?.id ?? null

  let updated
  try {
    updated = await materialRepository.recordMovement({
      materialId: id,
      ...parsed.data,
      createdById: userId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to record movement" },
      { status: 400 }
    )
  }

  // Low-stock alert (only when tracking stock and a threshold is set).
  const prevStock = Number(before.stockQuantity)
  const threshold = Number(before.lowStockThreshold)
  const newStock = Number(updated.stockQuantity)

  if (before.trackStock && threshold > 0) {
    const wasOk = prevStock > threshold
    const nowLow = newStock <= threshold
    const nowOut = newStock <= 0
    if (nowOut || (wasOk && nowLow)) {
      await inngest.send({
        name: "app/material.low-stock",
        data: {
          materialId: id,
          materialName: before.name,
          unit: before.unit,
          currentStock: newStock,
          threshold,
          isOutOfStock: nowOut,
        },
      })
    }
  }

  return NextResponse.json({ success: true, data: updated })
}
