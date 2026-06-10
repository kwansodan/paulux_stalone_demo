import GiftCardBuilder from "@/features/gift-card/components/gift-card-builder"
import { serviceRepository } from "@/features/service/server/service.repository"
import { productRepository } from "@/features/product/server/product.repository"

export const dynamic = 'force-dynamic'

export default async function GiftCardsPage() {
  const [services, products] = await Promise.all([
    serviceRepository.getAllServices({ isActive: true }),
    productRepository.getAllProducts({ isActive: true }),
  ])

  return (
    <div className="p-6">
      <GiftCardBuilder services={services} products={products} />
    </div>
  )
}
