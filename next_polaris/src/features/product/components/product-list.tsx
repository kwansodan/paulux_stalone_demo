'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SerializedProduct } from '../types'
import ProductCard from './product-card'
import { getProducts } from '../client/use-product'

const ProductList = ({
  products,
  searchQuery,
}: {
  products: SerializedProduct[]
  searchQuery?: string
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    initialData: products,
  })

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    data.forEach((p) => {
      if (p.category && !seen.has(p.category.id)) {
        seen.set(p.category.id, p.category.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 text-lg font-semibold mb-2">Failed to load products</p>
        <p className="text-gray-600 text-sm">{error?.message}</p>
      </div>
    )
  }

  const filteredProducts = data.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
    const matchesCategory = activeCategory ? product.category?.id === activeCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide max-w-full">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === null
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 text-lg font-semibold">No products found</p>
          <p className="text-gray-400 text-sm">
            {searchQuery || activeCategory
              ? 'Try a different search term or category'
              : 'Create your first product to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductList
