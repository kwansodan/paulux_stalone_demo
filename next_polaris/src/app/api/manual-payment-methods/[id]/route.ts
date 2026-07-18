import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "payments.view")
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const validated = UpdateSchema.parse(body)

    const method = await prisma.manualPaymentMethod.update({
      where: { id },
      data: validated,
    })
    return NextResponse.json({ success: true, data: method })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Payment method not found" }, { status: 404 })
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, message: "A payment method with that name already exists" }, { status: 409 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "payments.view")
    if (!auth.ok) return auth.response

    const { id } = await params

    const paymentCount = await prisma.payment.count({ where: { manualMethodId: id } })
    if (paymentCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete — ${paymentCount} payment(s) use this method. Deactivate it instead.` },
        { status: 409 }
      )
    }

    await prisma.manualPaymentMethod.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Deleted" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Payment method not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
