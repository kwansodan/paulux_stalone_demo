"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CircleX, MoreHorizontal, PencilLine, PackageCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleSwitch } from "@/features/service/components/toggle-switch"
import { SerializedProduct } from "../types"
import { useDeleteProduct, useUpdateProductStatus } from "../client/use-product"
import { useState } from "react"
import Modal from "@/components/modal"
import EditProductForm from "./form/edit-product-form"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Props = {
  product: SerializedProduct
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export default function ProductCard({ product, isSelectionMode, isSelected, onToggleSelect }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const currencySymbol = product.currency === "GHS" ? "₵" : product.currency

  const updateStatusMutation = useUpdateProductStatus()
  const deleteProductMutation = useDeleteProduct()

  const trackStock = (product as any).trackStock ?? false

  function handleCardClick() {
    if (isSelectionMode) onToggleSelect?.(product.id)
  }

  return (
    <Card
      onClick={handleCardClick}
      className={`relative rounded-3xl border shadow-none p-0 w-full overflow-hidden transition-all duration-150
        ${isSelectionMode ? "cursor-pointer select-none" : "hover:shadow-md"}
        ${isSelected ? "ring-2 ring-fuchsia-500 border-fuchsia-300" : ""}
      `}
    >
      {/* Selection checkbox overlay */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? "bg-fuchsia-600 border-fuchsia-600" : "bg-white border-gray-300"
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {product.imageUrl && (
        <div className="relative w-full h-40">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <p className="font-semibold text-lg leading-tight">{product.name}</p>
            <p className="text-sm font-normal text-muted-foreground line-clamp-2">
              {product.description || "No description"}
            </p>
          </div>

          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors flex-shrink-0">
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex gap-2 text-gray-900 cursor-pointer"
                >
                  <PencilLine className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex gap-2 text-red-600 cursor-pointer"
                >
                  <CircleX className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {product.category && (
            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
          )}

          {trackStock ? (
            product.stockQuantity <= 0 ? (
              <span className="text-[11px] font-medium bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                Out of stock
              </span>
            ) : product.stockQuantity <= product.lowStockThreshold ? (
              <span className="text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                Low stock · {product.stockQuantity}
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                {product.stockQuantity} in stock
              </span>
            )
          ) : (
            <span className="text-[11px] font-medium bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
              No stock tracking
            </span>
          )}

          {trackStock && (
            <span className="text-[11px] font-medium text-fuchsia-600 flex items-center gap-0.5">
              <PackageCheck className="w-3 h-3" /> Tracked
            </span>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-900">
            {currencySymbol}{Number(product.price).toFixed(2)}
          </span>

          {!isSelectionMode && (
            <ToggleSwitch
              checked={product.isActive}
              onChecked={() => updateStatusMutation.mutateAsync({ id: product.id, status: true })}
              onUnchecked={() => updateStatusMutation.mutateAsync({ id: product.id, status: false })}
            />
          )}
        </div>
      </CardContent>

      {!isSelectionMode && (
        <>
          <Modal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Product"
            childrenClassName="max-h-120"
            showSeparator
          >
            <EditProductForm
              product={product}
              onCancel={() => setIsEditModalOpen(false)}
              onSuccess={() => setIsEditModalOpen(false)}
            />
          </Modal>

          <Modal
            open={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Product?"
            subtitle={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
            childrenClassName="max-h-[224px] w-[500px]"
            showSeparator={false}
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#D10505] hover:bg-[#D10505]/90"
                onClick={() => deleteProductMutation.mutate(product.id)}
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </Card>
  )
}
