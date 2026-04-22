import { requireRole } from '@/app/_auth/require-role'
import ProductsClientShell from '@/features/product/components/products-client-shell'
import { productRepository } from '@/features/product/server/product.repository'
import { UserRole } from '@generated/prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  await requireRole([UserRole.ADMIN])

  const [products, categories] = await Promise.all([
    productRepository.getAllProducts({}),
    prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const serializedCategories = categories.map((cat) => ({
    ...cat,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <ProductsClientShell
        initialProducts={products}
        initialCategories={serializedCategories}
      />
    </div>
  )
}
