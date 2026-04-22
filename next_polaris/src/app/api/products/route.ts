import { productRepository } from "@/features/product/server/product.repository"
import { ProductUpsertSchema } from "@/features/product/utils/validation"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function GET() {
  try {
    const products = await productRepository.getAllProducts({})
    return NextResponse.json({ success: true, data: products }, { status: 200 })
  } catch (error) {
    console.error("Error getting products:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = ProductUpsertSchema.parse(body)
    const product = await productRepository.upsertProduct(validated)

    return NextResponse.json({ success: true, message: "Product saved successfully", data: product }, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error upserting product:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to save product" }, { status: 500 })
  }
}
