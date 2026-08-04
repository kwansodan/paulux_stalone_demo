"use client"

import { useState } from "react"
import { Plus, PencilLine, CircleX, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Modal from "@/components/modal"
import { useGetServiceCategories, useDeleteServiceCategory } from "../client/use-service-category"
import CategoryForm from "./form/category-form"
import { SerializedServiceCategory } from "@/features/service/types"

export default function ServiceCategoriesShell({
  initialCategories,
}: {
  initialCategories: SerializedServiceCategory[]
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SerializedServiceCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SerializedServiceCategory | null>(null)

  const { data: categories = initialCategories } = useGetServiceCategories()
  const deleteMutation = useDeleteServiceCategory()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Service Categories</h1>
          <p className="text-sm sm:text-[16px] text-gray-600">
            Group services and set concurrent booking capacity per group
          </p>
        </div>
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Category
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No categories yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Create a category to group services and control booking capacity.
          </p>
        </div>
      )}

      {/* Category grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-5 space-y-4">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500">
                        {cat._count?.services ?? 0} service{(cat._count?.services ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditTarget(cat)}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-500"
                    >
                      <CircleX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Capacity badge */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Concurrent capacity</span>
                  <span className="text-sm font-semibold bg-fuchsia-100 text-fuchsia-700 px-3 py-0.5 rounded-full">
                    {cat.capacity} booking{cat.capacity !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Category"
        childrenClassName="max-h-96"
        showSeparator
      >
        <CategoryForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Category"
        childrenClassName="max-h-96"
        showSeparator
      >
        {editTarget && (
          <CategoryForm
            category={editTarget}
            onCancel={() => setEditTarget(null)}
            onSuccess={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category?"
        subtitle={`Are you sure you want to delete "${deleteTarget?.name}"? Services assigned to this category will become uncategorised. This action cannot be undone.`}
        childrenClassName="max-h-56 w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            className="bg-[#D10505] hover:bg-[#D10505]/90"
            disabled={deleteMutation.isPending}
            onClick={async () => {
              if (deleteTarget) {
                await deleteMutation.mutateAsync(deleteTarget.id)
                setDeleteTarget(null)
              }
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
