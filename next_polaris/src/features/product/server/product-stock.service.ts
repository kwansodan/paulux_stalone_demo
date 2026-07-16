import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest"
import { Prisma } from "@generated/prisma/client"

// Kept as string literals rather than importing the generated enum so this
// compiles even when the local Prisma client is momentarily behind the schema
// (same defensive pattern used elsewhere in the product feature).
const SALE = "SALE"
const SALE_REVERSAL = "SALE_REVERSAL"

type LowStockAlert = {
  productId: string
  productName: string
  currentStock: number
  threshold: number
  isOutOfStock: boolean
}

/**
 * Makes product stock reflect a booking's committed state, idempotently.
 *
 * A booking "consumes" a tracked product's stock only once it is CONFIRMED or
 * COMPLETED; PENDING / CANCELLED consume nothing. The net already applied for a
 * (booking, product) pair is `Σ SALE − Σ SALE_REVERSAL`. We move stock by the
 * delta between the target and what's already applied, recording a SALE (deduct)
 * or SALE_REVERSAL (restore) movement linked to the booking.
 *
 * Because the delta is computed from the movement ledger, calling this repeatedly
 * (webhook retries, multiple confirmation paths, backfill re-runs) is a no-op once
 * in sync — so it's safe to over-call. Untracked products are ignored.
 *
 * Runs inside a transaction; pass `tx` to compose with an outer transaction.
 * Low-stock alerts are emitted after the DB work so they don't fire on rollback.
 */
export async function reconcileBookingProductStock(
  bookingId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const alerts: LowStockAlert[] = []

  const run = async (db: Prisma.TransactionClient) => {
    const dbAny = db as any

    const booking = await dbAny.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        products: {
          select: {
            productId: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                trackStock: true,
                stockQuantity: true,
                lowStockThreshold: true,
              },
            },
          },
        },
      },
    })

    if (!booking) return

    // A booking consumes stock only while it's a committed sale.
    const isSold = booking.status === "CONFIRMED" || booking.status === "COMPLETED"

    // Existing sale/reversal movements for this booking, so we know what's already applied.
    const movements = await dbAny.productStockMovement.findMany({
      where: { bookingId, type: { in: [SALE, SALE_REVERSAL] } },
      select: { productId: true, type: true, quantity: true },
    })

    const appliedByProduct = new Map<string, number>()
    for (const m of movements) {
      const signed = m.type === SALE ? m.quantity : -m.quantity
      appliedByProduct.set(m.productId, (appliedByProduct.get(m.productId) ?? 0) + signed)
    }

    // Target per tracked product currently on the booking.
    const targetByProduct = new Map<string, number>()
    const productMeta = new Map<
      string,
      { name: string; stockQuantity: number; lowStockThreshold: number }
    >()

    for (const bp of booking.products) {
      if (!bp.product?.trackStock) continue
      productMeta.set(bp.productId, {
        name: bp.product.name,
        stockQuantity: bp.product.stockQuantity,
        lowStockThreshold: bp.product.lowStockThreshold,
      })
      if (isSold) targetByProduct.set(bp.productId, bp.quantity)
    }

    // Consider the union of products currently on the booking and any that already
    // have movements for it, so a product removed during an edit gets fully reversed.
    const productIds = new Set<string>([
      ...targetByProduct.keys(),
      ...appliedByProduct.keys(),
    ])

    for (const productId of productIds) {
      const target = targetByProduct.get(productId) ?? 0
      const applied = appliedByProduct.get(productId) ?? 0
      const delta = target - applied
      if (delta === 0) continue

      // Meta may be missing if the product was removed from the booking (reversal
      // case) — fetch it so we can adjust stock and evaluate the low-stock threshold.
      let meta = productMeta.get(productId)
      if (!meta) {
        const p = await dbAny.product.findUnique({
          where: { id: productId },
          select: { name: true, stockQuantity: true, lowStockThreshold: true },
        })
        if (!p) continue
        meta = { name: p.name, stockQuantity: p.stockQuantity, lowStockThreshold: p.lowStockThreshold }
      }

      const prevStock = meta.stockQuantity
      // No clamp: keeps stockQuantity == starting + Σ signed movements, and a
      // negative value legitimately surfaces an oversell (UI treats <= 0 as "out").
      const newStock = prevStock - delta

      await dbAny.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      })

      await dbAny.productStockMovement.create({
        data: {
          productId,
          bookingId,
          type: delta > 0 ? SALE : SALE_REVERSAL,
          quantity: Math.abs(delta),
          notes: delta > 0 ? "Sale from booking" : "Sale reversal from booking",
        },
      })

      // Only a deduction can trip the low-stock alert — same threshold-cross rule
      // as the manual stock route.
      if (delta > 0) {
        const wasOk = prevStock > meta.lowStockThreshold
        const nowLow = newStock <= meta.lowStockThreshold
        const nowOut = newStock <= 0
        if (nowOut || (wasOk && nowLow)) {
          alerts.push({
            productId,
            productName: meta.name,
            currentStock: newStock,
            threshold: meta.lowStockThreshold,
            isOutOfStock: nowOut,
          })
        }
      }
    }
  }

  if (tx) {
    await run(tx)
  } else {
    await prisma.$transaction((client) => run(client))
  }

  for (const alert of alerts) {
    await inngest
      .send({ name: "app/product.low-stock", data: alert })
      .catch((err) => console.error("Failed to send low-stock event:", err))
  }
}
