import { serviceRepository } from "@/features/service/server/service.repository";
import { ServiceUpsertSchema } from "@/features/service/utils/validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoleApi } from "@/app/_auth/require-role-api";


export async function GET(request: NextRequest) {
  try {
    const services = await serviceRepository.getAllServices({})

    return NextResponse.json({
      success: true,
      message: `Successfully queried all services`,
      data: services
    }, { status: 200 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("Error getting all services: ", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"])
    if (!auth.ok) return auth.response

    const reqBody = await request.json();
    const validatedBody = ServiceUpsertSchema.parse(reqBody)

    const upsertedService = await serviceRepository.upsertService(validatedBody);

    return NextResponse.json({ success: true, message: "Successfully upserted service!", data: upsertedService }, { status: 200 })

  } catch (error: any) {
    if (error instanceof NextResponse) return error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating service: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to upsert service" }, { status: 500 })
  }
}