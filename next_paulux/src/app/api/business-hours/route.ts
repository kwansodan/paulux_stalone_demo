import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository";
import { BusinessHourInputSchema } from "@/features/business-hour/utils/validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoleApi } from "@/app/_auth/require-role-api";

export async function GET() {
  const hours = await businessHourRepository.getAll();
  return NextResponse.json({ success: true, data: hours });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "settings.view")
    if (!auth.ok) return auth.response

    const body = await req.json();
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating business hour: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to create business hour" }, { status: 500 })
  }
}
