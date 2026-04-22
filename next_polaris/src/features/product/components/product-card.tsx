"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CircleX, MoreHorizontal, PencilLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleSwitch } from "@/features/service/components/toggle-switch"
import { SerializedProduct } from "../types"
import { useDeleteProduct, useUpdateProductStatus } from "../client/use-product"
import { useState } from "react"
import Modal from "@/components/modal"
import EditProductForm from "./form/edit-product-form"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function ProductCard({ product }: { product: SerializedProduct }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const currencySymbol = product.currency === "GHS" ? "₵" : product.currency

  const updateStatusMutation = useUpdateProductStatus()
  const deleteProductMutation = useDeleteProduct()

  return (
    <Card className="relative rounded-3xl border shadow-none p-0 w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
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
          <div>
            <p className="font-semibold text-lg">{product.name}</p>
            <p className="text-sm font-normal text-muted-foreground line-clamp-2">
              {product.description || "No description"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
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
        </div>

        {product.category && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-900">
            {currencySymbol}{Number(product.price).toFixed(2)}
          </span>

          <ToggleSwitch
            checked={product.isActive}
            onChecked={() => updateStatusMutation.mutateAsync({ id: product.id, status: true })}
            onUnchecked={() => updateStatusMutation.mutateAsync({ id: product.id, status: false })}
          />
        </div>
      </CardContent>

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
    </Card>
  )
}
