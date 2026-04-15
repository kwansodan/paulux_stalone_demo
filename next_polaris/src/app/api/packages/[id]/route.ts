import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const UpdatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  price: z.number().min(0).optional(),
  minDepositPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string().uuid()).min(1).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json()
    const validated = UpdatePackageSchema.parse(body)

    const { serviceIds, ...rest } = validated

    const pkg = await prisma.servicePackage.update({
      where: { id },
      data: {
        ...rest,
        ...(serviceIds && {
          services: {
            deleteMany: {},
            create: serviceIds.map((serviceId) => ({ serviceId })),
          },
        }),
      },
      include: {
        services: { include: { service: true } },
      },
    })

    return NextResponse.json({ success: true, data: pkg })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 })
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
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const { id } = await params
    await prisma.servicePackage.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Package deleted" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
