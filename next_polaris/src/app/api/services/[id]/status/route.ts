import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { serviceRepository } from "@/features/service/server/service.repository"
import { ServiceStatusSchema } from "@/features/service/utils/validation"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "services.view")
    if (!auth.ok) return auth.response

    const awaitedParams = await params;
    const serviceId = awaitedParams.id
    const body = await request.json()
    const { isActive } = ServiceStatusSchema.parse(body)

    const service = await serviceRepository.findById(serviceId)

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      )
    }

    if (service.isActive === isActive) {
      return NextResponse.json(
        { success: false, error: "Service status cannot be set to the same status" },
        { status: 409 }
      )
    }

    const updated = await serviceRepository.updateStatus(serviceId, isActive)

    return NextResponse.json({
      success: true,
      message: "Service status updated successfully",
      data: updated,
    })
  } catch (error: any) {
    console.error("Service status error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update service status" },
      { status: 500 }
    )
  }
}
