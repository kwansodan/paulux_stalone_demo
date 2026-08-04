import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const CreatePromoCodeSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
  minBookingAmount: z.number().min(0).nullable().optional(),
})

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "promo_codes.view")
    if (!auth.ok) return auth.response

    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    })

    const serialized = codes.map((c) => ({
      ...c,
      discountValue: c.discountValue.toString(),
      minBookingAmount: c.minBookingAmount?.toString() ?? null,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "promo_codes.view")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = CreatePromoCodeSchema.parse(body)

    // Check for duplicate code
    const existing = await prisma.promoCode.findUnique({ where: { code: validated.code } })
    if (existing) {
      return NextResponse.json({ success: false, message: "A promo code with this name already exists" }, { status: 409 })
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: validated.code,
        description: validated.description ?? null,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        maxUses: validated.maxUses ?? null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive,
        minBookingAmount: validated.minBookingAmount ?? null,
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
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
