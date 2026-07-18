import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest"
import { NextRequest, NextResponse } from "next/server"
import { StockMovementSchema } from "@/features/product/utils/validation"

const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi(["ADMIN"], "products.view")
  if (!auth.ok) return auth.response

  const productId = (await params).id

  const movements = await db.productStockMovement.findMany({
    where: { productId },
    include: { createdBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({
    success: true,
    data: movements.map((m: any) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoleApi(["ADMIN"], "products.view")
  if (!auth.ok) return auth.response

  const productId = (await params).id

  const body = await request.json()
  const parsed = StockMovementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: (parsed.error.issues ?? [])[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { type, quantity, notes } = parsed.data

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true } as any,
  }) as any

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
  }

  // Fetch current stock separately to avoid TS issues
  const stockData = await db.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, lowStockThreshold: true },
  })

  const prevStock: number = stockData?.stockQuantity ?? 0
  const threshold: number = stockData?.lowStockThreshold ?? 5

  const userId = (auth as any).user?.id ?? null

  let newStock = prevStock
  if (type === "IN") newStock += quantity
  else if (type === "OUT") newStock = Math.max(0, newStock - quantity)
  // ADJUSTMENT is a relative +/- correction (quantity may be negative), not an
  // absolute "set to" — keeps the balance a clean sum of every movement.
  else if (type === "ADJUSTMENT") newStock = newStock + quantity

  await prisma.$transaction([
    db.product.update({
      where: { id: productId },
      data: { stockQuantity: newStock },
    }),
    db.productStockMovement.create({
      data: { productId, type, quantity, notes: notes ?? null, createdById: userId },
    }),
  ])

  const wasOk = prevStock > threshold
  const nowLow = newStock <= threshold
  const nowOut = newStock <= 0

  if (nowOut || (wasOk && nowLow)) {
    await inngest.send({
      name: "app/product.low-stock",
      data: {
        productId,
        productName: product.name,
        currentStock: newStock,
        threshold,
        isOutOfStock: nowOut,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: { productId, newStock, type, quantity },
  })
}
