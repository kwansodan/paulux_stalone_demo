'use client'

import { useState } from 'react'
import ProductHeader from './product-header'
import ProductList from './product-list'
import { SerializedProduct } from '../types'
import ProductCategoriesShell from '@/features/product-category/components/product-categories-shell'
import { SerializedProductCategory } from '@/features/product-category/client/use-product-category'

interface ProductsClientShellProps {
  initialProducts: SerializedProduct[]
  initialCategories: SerializedProductCategory[]
}

const ProductsClientShell = ({ initialProducts, initialCategories }: ProductsClientShellProps) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">Manage retail products available to add to bookings</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          <ProductHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <ProductList products={initialProducts} searchQuery={searchQuery} />
        </>
      )}

      {activeTab === 'categories' && (
        <ProductCategoriesShell initialCategories={initialCategories} />
      )}
    </div>
  )
}

export default ProductsClientShell
