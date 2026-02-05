import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { BusinessHourStatusSchema } from "@/features/business-hour/utils/validation"
import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const dayOfWeek = Number(awaitedParams.dayOfWeek)

    const body = await request.json()
    const { isOpen } = BusinessHourStatusSchema.parse(body)

    const existingHour = await businessHourRepository.findByDayOfWeek(dayOfWeek)
    if (!existingHour) {
      return NextResponse.json(
        { success: false, error: 'No business hour exists for chosen day of week' },
        { status: 409 })
    }

    if (existingHour.isOpen === isOpen) {
      return NextResponse.json(
        { success: false, error: "Business Hour status cannot be set to the same status" },
        { status: 409 }
      )
    }

    const updated = await businessHourRepository.updateStatus(dayOfWeek, isOpen)

    return NextResponse.json({
      success: true,
      message: "Business Hour status updated successfully",
      data: updated,
    })
  } catch (error: any) {
    console.error("Business hour status error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update business hour status" },
      { status: 500 }
    )
  }
}
