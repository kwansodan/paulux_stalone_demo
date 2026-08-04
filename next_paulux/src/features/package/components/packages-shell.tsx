"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, PencilLine, CircleX, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Modal from "@/components/modal"
import { useGetPackages, useDeletePackage } from "../client/use-packages"
import PackageForm from "./form/package-form"
import { SerializedPackage } from "../types"
import { SerializedService } from "@/features/service/types"

interface PackagesShellProps {
  initialPackages: SerializedPackage[]
  services: SerializedService[]
}

export default function PackagesShell({ initialPackages, services }: PackagesShellProps) {
  const { data: packages = initialPackages } = useGetPackages()
  const deleteMutation = useDeletePackage()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SerializedPackage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SerializedPackage | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-sm text-gray-500">Bundle multiple services into a single bookable package</p>
        </div>
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Package
        </Button>
      </div>

      {/* Empty state */}
      {packages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Package className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No packages yet</p>
          <p className="text-gray-400 text-sm mt-1">Create a package to bundle services at a special price.</p>
        </div>
      )}

      {/* Package grid */}
      {packages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const individualTotal = pkg.services.reduce((sum, ps) => sum + Number(ps.service.price), 0)
            const savings = individualTotal - Number(pkg.price)
            return (
              <Card key={pkg.id} className={`rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200 overflow-hidden ${!pkg.isActive ? "opacity-60" : ""}`}>
                {pkg.imageUrl && (
                  <div className="relative w-full h-36">
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" unoptimized />
                    {!pkg.isActive && (
                      <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                        <span className="text-xs font-semibold bg-gray-800/70 text-white px-2 py-0.5 rounded-full">Inactive</span>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{pkg.name}</p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditTarget(pkg)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <PencilLine className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(pkg)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-500">
                        <CircleX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Services included */}
                  <div className="flex flex-wrap gap-1">
                    {pkg.services.map((ps) => (
                      <span key={ps.serviceId} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ps.service.name}
                      </span>
                    ))}
                  </div>

                  {/* Price row */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-lg font-bold text-fuchsia-600">₵{Number(pkg.price).toFixed(2)}</span>
                      {savings > 0 && (
                        <span className="ml-2 text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          Save ₵{savings.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">
                      {Number(pkg.minDepositFixed) > 0 ? `GHS ${Number(pkg.minDepositFixed).toFixed(2)} deposit` : "No deposit"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Package" childrenClassName="max-h-[600px]" showSeparator>
        <PackageForm services={services} onCancel={() => setCreateOpen(false)} onSuccess={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Package" childrenClassName="max-h-[600px]" showSeparator>
        {editTarget && (
          <PackageForm pkg={editTarget} services={services} onCancel={() => setEditTarget(null)} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Package?"
        subtitle={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        childrenClassName="max-h-56 w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            className="bg-[#D10505] hover:bg-[#D10505]/90"
            disabled={deleteMutation.isPending}
            onClick={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null) } }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
