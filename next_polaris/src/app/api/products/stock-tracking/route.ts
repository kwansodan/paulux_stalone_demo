import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { UserRole } from "@generated/prisma/client"
import { productRepository } from "@/features/product/server/product.repository"

const Schema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one product required"),
  trackStock: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const auth = await requireRoleApi([UserRole.ADMIN], "products.view")
  if (!auth.ok) return auth.response!

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const { ids, trackStock } = parsed.data
  await productRepository.batchUpdateStockTracking(ids, trackStock)

  return NextResponse.json({ success: true, updated: ids.length })
}
