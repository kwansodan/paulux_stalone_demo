"use client"

import Modal from "@/components/modal"
import { SerializedMaterial } from "@/features/material/types"
import { useGetMaterialMovements } from "@/features/material/client/use-materials"
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react"

type Props = {
  material: SerializedMaterial
  open: boolean
  onClose: () => void
}

const META: Record<string, { label: string; icon: React.ReactNode; colour: string }> = {
  IN: { label: "Restock", icon: <ArrowDownCircle className="w-4 h-4" />, colour: "text-green-600" },
  OUT: { label: "Issued", icon: <ArrowUpCircle className="w-4 h-4" />, colour: "text-fuchsia-600" },
  ADJUSTMENT: { label: "Adjusted", icon: <SlidersHorizontal className="w-4 h-4" />, colour: "text-blue-600" },
}

export default function MaterialHistoryModal({ material, open, onClose }: Props) {
  const { data: movements, isLoading } = useGetMaterialMovements(open ? material.id : null)

  return (
    <Modal open={open} onClose={onClose} title="Usage History" subtitle={material.name} childrenClassName="max-h-[500px]">
      <div className="space-y-2 py-2">
        {isLoading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}
        {!isLoading && (!movements || movements.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">No movements recorded yet.</p>
        )}
        {movements?.map((m) => {
          const meta = META[m.type] ?? META.ADJUSTMENT
          const cost = Number(m.quantity) * Number(m.unitCostAtMovement)
          return (
            <div key={m.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
              <div className="flex items-start gap-2 min-w-0">
                <span className={meta.colour}>{meta.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {meta.label}
                    {m.section ? <span className="text-gray-500"> → {m.section.name}</span> : null}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleString()}{m.createdBy ? ` · ${m.createdBy.username}` : ""}
                  </p>
                  {m.notes && <p className="text-xs text-gray-500 mt-0.5">{m.notes}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {m.type === "OUT" ? "-" : m.type === "IN" ? "+" : "="}{Number(m.quantity)} {material.unit}
                </p>
                {m.type === "OUT" && (
                  <p className="text-xs text-gray-500">GHS {cost.toFixed(2)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
