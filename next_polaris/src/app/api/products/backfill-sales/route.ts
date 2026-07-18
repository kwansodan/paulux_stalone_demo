import { NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"

const db = prisma as any

/**
 * One-off, idempotent backfill: records the product SALE movements that were
 * never created for bookings confirmed before stock-on-sale tracking existed,
 * and decrements stock accordingly.
 *
 * Scoped PER PRODUCT to sales after that product's FIRST stock-in — because the
 * current balance already reflects stock-ins/outs/adjustments but no sales, only
 * sales since the product first had inventory need catching up. A product with
 * no IN movement falls back to its createdAt.
 *
 * Idempotent: skips any (booking, product) that already carries a SALE movement,
 * so it's safe to re-run and won't fight the live reconciliation.
 */
export async function POST() {
  const auth = await requireRoleApi(["ADMIN"], "products.view")
  if (!auth.ok) return auth.response

  try {
    const products = await db.product.findMany({
      where: { trackStock: true },
      select: { id: true, name: true, stockQuantity: true, createdAt: true },
    })

    let productsTouched = 0
    let movementsCreated = 0
    const details: Array<{ productId: string; name: string; created: number }> = []

    for (const product of products) {
      // Cutoff = first stock-in time, or the product's creation time if it has no IN yet.
      const firstIn = await db.productStockMovement.findFirst({
        where: { productId: product.id, type: "IN" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      })
      const cutoff: Date = firstIn?.createdAt ?? product.createdAt

      // Bookings already carrying a SALE for this product — skip (idempotency).
      const existingSales = await db.productStockMovement.findMany({
        where: { productId: product.id, type: "SALE", bookingId: { not: null } },
        select: { bookingId: true },
      })
      const alreadySold = new Set<string>(existingSales.map((s: any) => s.bookingId))

      // This product's sales on committed bookings.
      const bookingProducts = await db.bookingProduct.findMany({
        where: {
          productId: product.id,
          booking: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        },
        select: {
          bookingId: true,
          quantity: true,
          booking: {
            select: {
              createdAt: true,
              payments: {
                where: { status: "PAID" },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { createdAt: true },
              },
            },
          },
        },
      })

      let runningStock: number = product.stockQuantity
      let createdForProduct = 0

      for (const bp of bookingProducts) {
        if (alreadySold.has(bp.bookingId)) continue

        // Sale time proxy: earliest PAID payment, else the booking's creation time.
        const saleTime: Date = bp.booking.payments[0]?.createdAt ?? bp.booking.createdAt
        if (saleTime < cutoff) continue

        runningStock -= bp.quantity
        await db.productStockMovement.create({
          data: {
            productId: product.id,
            bookingId: bp.bookingId,
            type: "SALE",
            quantity: bp.quantity,
            notes: "Sale from booking (backfill)",
          },
        })
        createdForProduct++
      }

      if (createdForProduct > 0) {
        await db.product.update({
          where: { id: product.id },
          data: { stockQuantity: runningStock },
        })
        productsTouched++
        movementsCreated += createdForProduct
        details.push({ productId: product.id, name: product.name, created: createdForProduct })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${movementsCreated} sale movement(s) across ${productsTouched} product(s).`,
      data: { productsTouched, movementsCreated, details },
    })
  } catch (error: any) {
    console.error("Backfill sales error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to backfill sales" },
      { status: 500 }
    )
  }
}
