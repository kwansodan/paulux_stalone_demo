import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest"
import { UserRole } from "@generated/prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { bookingInclude } from "@/lib/prisma-includes"

type Assignment = { serviceId: string; stylistId: string | null }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "bookings.view")
    if (!auth.ok) return auth.response

    const bookingId = (await params).id
    const body = await request.json()
    const assignments: Assignment[] = body.assignments

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, message: "assignments array is required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 })
    }

    // Validate all assignees are STAFF users flagged as stylists (only stylists
    // are assignable to bookings).
    const stylistIds = assignments.map(a => a.stylistId).filter(Boolean) as string[]
    if (stylistIds.length > 0) {
      const stylists = await prisma.user.findMany({
        where: { id: { in: stylistIds }, role: UserRole.STAFF, isStylist: true } as any,
        select: { id: true },
      })
      const validIds = new Set(stylists.map(s => s.id))
      const invalid = stylistIds.find(id => !validIds.has(id))
      if (invalid) {
        return NextResponse.json(
          { success: false, message: "One or more assignees are not stylists" },
          { status: 400 }
        )
      }
    }

    // Fetch current assignments to detect changes
    const currentServices = await prisma.bookingService.findMany({
      where: { bookingId },
      select: { serviceId: true, assignedToId: true } as any,
    }) as unknown as { serviceId: string; assignedToId: string | null }[]
    const currentMap = new Map(currentServices.map(s => [s.serviceId, s.assignedToId]))

    // Apply updates
    await prisma.$transaction(
      assignments.map(({ serviceId, stylistId }) =>
        prisma.bookingService.update({
          where: { bookingId_serviceId: { bookingId, serviceId } },
          data: { assignedToId: stylistId ?? null } as any,
        })
      )
    )

    // Fire Inngest SMS only for newly assigned stylists (not unchanged, not removals)
    const toNotify = assignments.filter(
      ({ serviceId, stylistId }) =>
        stylistId !== null && currentMap.get(serviceId) !== stylistId
    )

    if (toNotify.length > 0) {
      await inngest.send(
        toNotify.map(({ serviceId, stylistId }) => ({
          name: "app/booking.stylist-assigned" as const,
          data: { bookingId, serviceId, stylistId: stylistId! },
        }))
      )
    }

    const updated = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    })

    return NextResponse.json({
      success: true,
      message: "Stylist assignments updated",
      data: updated,
    })
  } catch (error: any) {
    console.error("Error assigning service stylists:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
