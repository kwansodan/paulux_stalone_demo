import { Suspense } from "react"
import GiftCardSuccess from "@/features/gift-card/components/gift-card-success"

export const dynamic = 'force-dynamic'

export default function GiftCardSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-16 px-4 text-center text-gray-400">Loading...</div>}>
      <GiftCardSuccess />
    </Suspense>
  )
}
