import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository";
import { BusinessHourInputSchema } from "@/features/business-hour/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const hours = await businessHourRepository.getAll();
  return NextResponse.json({ success: true, data: hours });
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    console.log('POST BUSINESS HOURS DATA', body)
    const data = BusinessHourInputSchema.parse(body);

    const existingHour = await businessHourRepository.findByDayOfWeek(data.dayOfWeek)
    if (!existingHour) {
      return NextResponse.json(
        { success: false, error: 'No business hour exists for chosen day of week' },
        { status: 409 })
    }

    const result = await businessHourRepository.update(data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating business hour: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to create business hour" }, { status: 500 })
  }
}
