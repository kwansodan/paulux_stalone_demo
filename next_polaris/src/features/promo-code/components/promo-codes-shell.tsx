"use client"

import { useState } from "react"
import { Plus, PencilLine, CircleX, Tag, Infinity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Modal from "@/components/modal"
import { useGetPromoCodes, useDeletePromoCode } from "../client/use-promo-codes"
import PromoCodeForm from "./form/promo-code-form"
import { SerializedPromoCode } from "../types"
import Pagination from "@/components/pagination"

const PAGE_SIZE = 12

interface PromoCodesShellProps {
  initialCodes: SerializedPromoCode[]
}

function DiscountBadge({ promo }: { promo: SerializedPromoCode }) {
  const val = Number(promo.discountValue)
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-fuchsia-100 text-fuchsia-700 px-2.5 py-1 rounded-full">
      {promo.discountType === "PERCENTAGE" ? `${val}% OFF` : `₵${val.toFixed(2)} OFF`}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}

export default function PromoCodesShell({ initialCodes }: PromoCodesShellProps) {
  const { data: codes = initialCodes } = useGetPromoCodes()
  const deleteMutation = useDeletePromoCode()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SerializedPromoCode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SerializedPromoCode | null>(null)
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(codes.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedCodes = codes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-sm text-gray-500">Create and manage discount codes for customer bookings</p>
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Promo Code
        </Button>
      </div>

      {/* Empty state */}
      {codes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Tag className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No promo codes yet</p>
          <p className="text-gray-400 text-sm mt-1">Create a promo code to offer discounts to customers.</p>
        </div>
      )}

      {/* Codes grid */}
      {codes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pagedCodes.map((promo) => {
            const isExpired = promo.expiresAt ? new Date(promo.expiresAt) < new Date() : false
            const isMaxed = promo.maxUses !== null && promo.usedCount >= promo.maxUses
            const effectivelyActive = promo.isActive && !isExpired && !isMaxed

            return (
              <Card
                key={promo.id}
                className={`rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200 overflow-hidden ${!effectivelyActive ? "opacity-60" : ""}`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wide">{promo.code}</span>
                        <StatusBadge isActive={effectivelyActive} />
                        {isExpired && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>}
                        {isMaxed && <span className="text-[10px] font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Limit reached</span>}
                      </div>
                      <DiscountBadge promo={promo} />
                      {promo.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{promo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditTarget(promo)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        <PencilLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(promo)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-500"
                      >
                        <CircleX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    {/* Uses */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Uses</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {promo.usedCount}
                        {" / "}
                        {promo.maxUses !== null
                          ? promo.maxUses
                          : <Infinity className="inline w-3.5 h-3.5 text-gray-400" />
                        }
                      </p>
                    </div>

                    {/* Expiry */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Expires</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {promo.expiresAt
                          ? new Date(promo.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
                          : "Never"
                        }
                      </p>
                    </div>

                    {/* Min amount */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Min. order</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {promo.minBookingAmount
                          ? `₵${Number(promo.minBookingAmount).toFixed(0)}`
                          : "None"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {codes.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Promo Code" childrenClassName="max-h-[600px]" showSeparator>
        <PromoCodeForm onCancel={() => setCreateOpen(false)} onSuccess={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Promo Code" childrenClassName="max-h-[600px]" showSeparator>
        {editTarget && (
          <PromoCodeForm promo={editTarget} onCancel={() => setEditTarget(null)} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Promo Code?"
        subtitle={`Are you sure you want to delete "${deleteTarget?.code}"? This cannot be undone.`}
        childrenClassName="max-h-56 w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
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
