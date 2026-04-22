import { productRepository } from "@/features/product/server/product.repository"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })
    }

    const deleted = await productRepository.deleteById(id)

    return NextResponse.json(
      { success: true, message: `${deleted.name} deleted successfully` },
      { status: 200 }
    )
  } catch (error) {
    console.error("Product delete error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete product" }, { status: 500 })
  }
}
