import { requireRole } from "@/app/_auth/require-role"
import BookingClientShell from "@/features/booking/components/booking-client-shell"
import { serviceRepository } from "@/features/service/server/service.repository"
import { productRepository } from "@/features/product/server/product.repository"
import { UserRole } from "@generated/prisma/enums"

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
  const user = await requireRole([UserRole.ADMIN])

  const [services, products] = await Promise.all([
    serviceRepository.getAllServices({ isActive: true }),
    productRepository.getAllProducts({ isActive: true }),
  ])

  return (
    <BookingClientShell services={services} products={products} user={user} />
  )
}
