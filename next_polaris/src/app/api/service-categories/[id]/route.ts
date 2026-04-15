import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  capacity: z.number().int().min(1, "Capacity must be at least 1").optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const validated = UpdateCategorySchema.parse(body);

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: validated,
      include: {
        _count: { select: { services: true } },
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "A category with this name already exists" },
        { status: 409 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    console.error("Error updating service category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    await prisma.serviceCategory.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting service category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
