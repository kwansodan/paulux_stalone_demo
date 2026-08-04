import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const CreateSchema = z.object({
  name: z.string().min(1).max(50),
})

export async function GET() {
  try {
    const auth = await requireRoleApi(["ADMIN"], "payments.view")
    if (!auth.ok) return auth.response

    const methods = await prisma.manualPaymentMethod.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ success: true, data: methods })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "payments.view")
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { name } = CreateSchema.parse(body)

    const max = await prisma.manualPaymentMethod.aggregate({ _max: { sortOrder: true } })
    const nextOrder = (max._max.sortOrder ?? -1) + 1

    const method = await prisma.manualPaymentMethod.create({
      data: { name, sortOrder: nextOrder },
    })
    return NextResponse.json({ success: true, data: method }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ success: false, message: "A payment method with that name already exists" }, { status: 409 })
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
