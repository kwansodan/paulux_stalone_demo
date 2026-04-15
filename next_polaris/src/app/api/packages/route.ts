import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const CreatePackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  minDepositPercent: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string().uuid()).min(1, "At least one service is required"),
})

export async function GET() {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { isActive: true },
      include: {
        services: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ success: true, data: packages })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const body = await request.json()
    const validated = CreatePackageSchema.parse(body)

    const pkg = await prisma.servicePackage.create({
      data: {
        name: validated.name,
        description: validated.description ?? null,
        imageUrl: validated.imageUrl ?? null,
        price: validated.price,
        minDepositPercent: validated.minDepositPercent,
        isActive: validated.isActive,
        services: {
          create: validated.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: {
        services: { include: { service: true } },
      },
    })

    return NextResponse.json({ success: true, data: pkg }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
