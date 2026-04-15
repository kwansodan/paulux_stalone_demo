import { requireRoleApi } from "@/app/_auth/require-role-api";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const validated = CreateCategorySchema.parse(body);

    const category = await prisma.serviceCategory.create({
      data: {
        name: validated.name,
        capacity: validated.capacity,
      },
      include: {
        _count: { select: { services: true } },
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
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
    console.error("Error creating service category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
