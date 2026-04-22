'use client'

import Modal from '@/components/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'
import CreateProductForm from './form/create-product-form'

interface ProductHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export default function ProductHeader({ searchQuery, onSearchChange }: ProductHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-white border-gray-200"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setOpen(true)}
        >
          + New Product
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Product"
        childrenClassName="max-h-120"
        showSeparator
      >
        <CreateProductForm
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </div>
  )
}
