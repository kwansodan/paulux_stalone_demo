import { requireRoleApi } from "@/app/_auth/require-role-api";
import { blockedDateRepository } from "@/features/blocked-date/server/blockedDate.repository";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string; }>; }
) {
  const awaitedParams = await params;
  const record = await blockedDateRepository.findByDate(awaitedParams.date);
  return NextResponse.json({ success: true, data: record });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ date: string; }>; }
) {
  const auth = await requireRoleApi(['ADMIN'])
  if (!auth.ok) return auth.response


  const awaitedParams = await params;
  await blockedDateRepository.deleteByDate(awaitedParams.date);
  return NextResponse.json({ success: true });
}
