'use client'

import { useState } from 'react'
import ProductHeader from './product-header'
import ProductList from './product-list'
import { SerializedProduct } from '../types'
import ProductCategoriesShell from '@/features/product-category/components/product-categories-shell'
import { SerializedProductCategory } from '@/features/product-category/client/use-product-category'
import StockManagementShell from './stock-management-shell'

interface ProductsClientShellProps {
  initialProducts: SerializedProduct[]
  initialCategories: SerializedProductCategory[]
}

const TABS = [
  { id: 'products',    label: 'Products' },
  { id: 'stock',       label: 'Stock' },
  { id: 'categories',  label: 'Categories' },
] as const

type Tab = typeof TABS[number]['id']

const ProductsClientShell = ({ initialProducts, initialCategories }: ProductsClientShellProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">Manage retail products available to add to bookings</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          <ProductHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <ProductList products={initialProducts} searchQuery={searchQuery} />
        </>
      )}

      {activeTab === 'stock' && (
        <StockManagementShell initialProducts={initialProducts} />
      )}

      {activeTab === 'categories' && (
        <ProductCategoriesShell initialCategories={initialCategories} />
      )}
    </div>
  )
}

export default ProductsClientShell
