import { requireRoleApi } from "@/app/_auth/require-role-api";
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository";
import { BlockedDateInputSchema } from "@/features/blocked-date/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await requireRoleApi(['ADMIN'])
  if (!auth.ok) return auth.response

  const dates = await blockedDateRepository.getAll();
  return NextResponse.json({ success: true, data: dates });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoleApi(['ADMIN'])
    if (!auth.ok) return auth.response


    const body = await req.json();
    const data = BlockedDateInputSchema.parse(body);

    const result = await blockedDateRepository.upsert(data);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating blocked date: ", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to create blocked date" }, { status: 500 })
  }
}
