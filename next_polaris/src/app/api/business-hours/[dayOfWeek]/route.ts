import { businessHourRepository } from "@/features/business-hour/server/businessHour.repository";
import { NextResponse } from "next/server";
import { requireRoleApi } from "@/app/_auth/require-role-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  const awaitedParams = await params;
  const day = Number(awaitedParams.dayOfWeek);
  const record = await businessHourRepository.findByDayOfWeek(day);

  return NextResponse.json({ success: true, data: record });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dayOfWeek: string }> }
) {
  const auth = await requireRoleApi(["ADMIN"])
  if (!auth.ok) return auth.response

  const awaitedParams = await params;
  const day = Number(awaitedParams.dayOfWeek);
  await businessHourRepository.deleteByDayOfWeek(day);

  return NextResponse.json({ success: true });
}
