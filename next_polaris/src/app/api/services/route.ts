import { serviceRepository } from "@/features/service/server/service.repository";
import { ServiceUpsertSchema } from "@/features/service/utils/validation";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    // await isAuthenticated()
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
    const reqBody = await request.json();
    const validatedBody = ServiceUpsertSchema.parse(reqBody)

    const upsertedService = await serviceRepository.upsertService(validatedBody);

    return NextResponse.json({ successs: true, message: "Successfully upserted service!", data: upsertedService }, { status: 200 })

  } catch (error: any) {
    if (error instanceof NextResponse) return error
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating service: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to upsert service" }, { status: 500 })
  }
}