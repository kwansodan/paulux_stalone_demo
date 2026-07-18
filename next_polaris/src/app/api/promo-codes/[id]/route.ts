import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdatePromoCodeSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()).optional(),
  description: z.string().nullable().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  minBookingAmount: z.number().min(0).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "promo_codes.view")
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const validated = UpdatePromoCodeSchema.parse(body)

    // Check duplicate code if code is being changed
    if (validated.code) {
      const existing = await prisma.promoCode.findFirst({
        where: { code: validated.code, id: { not: id } },
      })
      if (existing) {
        return NextResponse.json({ success: false, message: "A promo code with this name already exists" }, { status: 409 })
      }
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(validated.code !== undefined && { code: validated.code }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.discountType !== undefined && { discountType: validated.discountType }),
        ...(validated.discountValue !== undefined && { discountValue: validated.discountValue }),
        ...(validated.maxUses !== undefined && { maxUses: validated.maxUses }),
        ...(validated.expiresAt !== undefined && { expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
        ...(validated.minBookingAmount !== undefined && { minBookingAmount: validated.minBookingAmount }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...promo,
        discountValue: promo.discountValue.toString(),
        minBookingAmount: promo.minBookingAmount?.toString() ?? null,
        expiresAt: promo.expiresAt?.toISOString() ?? null,
        createdAt: promo.createdAt.toISOString(),
        updatedAt: promo.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 })
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
    const auth = await requireRoleApi(["ADMIN"], "promo_codes.view")
    if (!auth.ok) return auth.response

    const { id } = await params
    await prisma.promoCode.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Promo code deleted" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Promo code not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
