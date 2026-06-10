import { NextRequest, NextResponse } from "next/server"
import { requireRoleApi } from "@/app/_auth/require-role-api"
import { prisma } from "@/lib/prisma"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { GiftCardStatus } from "@generated/prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "gift_cards.manage")
    if (!auth.ok) return auth.response

    const { id } = await params

    const giftCard = await giftCardRepository.findById(id)
    if (!giftCard) {
      return NextResponse.json({ success: false, message: "Gift card not found" }, { status: 404 })
    }

    if (giftCard.status === "REDEEMED" || giftCard.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: `Cannot cancel a gift card with status ${giftCard.status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.giftCard.update({
      where: { id },
      data: { status: GiftCardStatus.CANCELLED },
      include: { items: true },
    })

    return NextResponse.json({
      success: true,
      data: { ...updated, totalAmount: updated.totalAmount.toString(), balance: updated.balance.toString() },
    })
  } catch (error: any) {
    console.error("Error cancelling gift card:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to cancel gift card" }, { status: 500 })
  }
}
