import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { productRepository } from "@/features/product/server/product.repository"
import { ProductStatusSchema } from "@/features/product/utils/validation"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "products.view")
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const { isActive } = ProductStatusSchema.parse(body)

    const product = await productRepository.findById(id)

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    if (product.isActive === isActive) {
      return NextResponse.json(
        { success: false, error: "Product status is already set to that value" },
        { status: 409 }
      )
    }

    const updated = await productRepository.updateStatus(id, isActive)

    return NextResponse.json({
      success: true,
      message: "Product status updated successfully",
      data: updated,
    })
  } catch (error: any) {
    console.error("Product status error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product status" },
      { status: 500 }
    )
  }
}
