import { requireRole } from "@/app/_auth/require-role"
import GiftCardOrdersShell from "@/features/gift-card/components/gift-card-orders-shell"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { UserRole } from "@generated/prisma/client"

export const dynamic = "force-dynamic"

export default async function GiftCardOrdersPage() {
  await requireRole([UserRole.ADMIN], "gift_cards.view")

  const giftCards = await giftCardRepository.getAll()

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Gift Cards</h1>
          <p className="text-sm sm:text-[16px] text-gray-600">View and manage gift cards purchased by customers</p>
        </div>
        <GiftCardOrdersShell initialGiftCards={giftCards} />
      </div>
    </div>
  )
}
