import { NextResponse } from "next/server"
import { paymentRepository } from "@/features/payment/server/payment.repository"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function GET() {
  await requireRoleApi(["ADMIN"])
  const metrics = await paymentRepository.getMetrics()
  return NextResponse.json({
    success: true,
    message: "Successfully retrieved payment metrics",
    data: metrics
  }, { status: 200 })
}
