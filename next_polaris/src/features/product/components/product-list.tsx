'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SerializedProduct } from '../types'
import ProductCard from './product-card'
import { getProducts, useUpdateStockTracking } from '../client/use-product'
import { PackageCheck, X, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Pagination from '@/components/pagination'

const PAGE_SIZE = 12

const ProductList = ({
  products,
  searchQuery,
}: {
  products: SerializedProduct[]
  searchQuery?: string
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    initialData: products,
  })

  const stockTrackingMutation = useUpdateStockTracking()

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    data.forEach((p) => {
      if (p.category && !seen.has(p.category.id)) {
        seen.set(p.category.id, p.category.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  const filteredProducts = useMemo(() => data.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
    const matchesCategory = activeCategory ? product.category?.id === activeCategory : true
    return matchesSearch && matchesCategory
  }), [data, searchQuery, activeCategory])

  // Reset to the first page whenever the filters change (adjust-state-on-render
  // pattern — avoids a setState-in-effect cascade).
  const filterKey = `${searchQuery ?? ''}|${activeCategory ?? ''}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function enterSelectionMode() {
    setIsSelectionMode(true)
    setSelectedIds(new Set())
  }

  function exitSelectionMode() {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  async function handleBatchUpdate(trackStock: boolean) {
    if (selectedIds.size === 0) return
    await stockTrackingMutation.mutateAsync({ ids: Array.from(selectedIds), trackStock })
    exitSelectionMode()
  }

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

  const allVisibleSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length

  return (
    <div className="space-y-4">
      {/* Category tabs + Manage Stock button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {categories.length > 0 && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto scrollbar-hide max-w-full">
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

        {!isSelectionMode ? (
          <button
            onClick={enterSelectionMode}
            className="flex items-center gap-1.5 text-sm font-medium text-fuchsia-700 hover:text-fuchsia-900 transition-colors flex-shrink-0"
          >
            <PackageCheck className="w-4 h-4" />
            Manage Stock Tracking
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {allVisibleSelected ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={exitSelectionMode}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {isSelectionMode && (
        <p className="text-xs text-gray-400">
          Select products to enable or disable inventory tracking for them all at once.
        </p>
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
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${isSelectionMode ? "pb-24" : ""}`}>
            {pagedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(p.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      {/* Sticky action bar — only shown in selection mode */}
      {isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-white border-t shadow-2xl px-6 py-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size === 0
              ? "No products selected"
              : `${selectedIds.size} product${selectedIds.size !== 1 ? "s" : ""} selected`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exitSelectionMode}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.size === 0 || stockTrackingMutation.isPending}
              onClick={() => handleBatchUpdate(false)}
              className="text-gray-700"
            >
              Disable Tracking
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || stockTrackingMutation.isPending}
              onClick={() => handleBatchUpdate(true)}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            >
              {stockTrackingMutation.isPending ? "Saving..." : "Enable Tracking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
