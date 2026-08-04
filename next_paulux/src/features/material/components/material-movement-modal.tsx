"use client"

import { useEffect, useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react"
import { SerializedMaterial } from "@/features/material/types"
import { useGetSections, useRecordMaterialMovement } from "@/features/material/client/use-materials"

type MovementType = "IN" | "OUT" | "ADJUSTMENT"

type Props = {
  material: SerializedMaterial
  open: boolean
  onClose: () => void
  /** Which movement type the modal opens on (e.g. "OUT" from an Issue button). */
  initialType?: MovementType
}

const TYPES: { value: MovementType; label: string; description: string; icon: React.ReactNode; colour: string }[] = [
  { value: "OUT", label: "Issue", description: "Give to a section", icon: <ArrowUpCircle className="w-4 h-4" />, colour: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700" },
  { value: "IN", label: "Restock", description: "Add purchased stock", icon: <ArrowDownCircle className="w-4 h-4" />, colour: "border-green-500 bg-green-50 text-green-700" },
  { value: "ADJUSTMENT", label: "Adjust", description: "Set exact count", icon: <SlidersHorizontal className="w-4 h-4" />, colour: "border-blue-400 bg-blue-50 text-blue-700" },
]

export default function MaterialMovementModal({ material, open, onClose, initialType = "OUT" }: Props) {
  const [type, setType] = useState<MovementType>(initialType)
  const [quantity, setQuantity] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: sections } = useGetSections(true)
  const mutation = useRecordMaterialMovement()

  useEffect(() => {
    if (open) {
      setType(initialType)
      setQuantity("")
      setSectionId("")
      setUnitCost("")
      setNotes("")
      setError(null)
    }
  }, [open, initialType])

  const current = Number(material.stockQuantity)
  const qty = Number(quantity) || 0
  const preview = type === "IN" ? current + qty : type === "OUT" ? current - qty : qty

  const handleSave = async () => {
    if (!qty || qty <= 0) return setError("Enter a quantity greater than zero")
    if (type === "OUT" && !sectionId) return setError("Select the section receiving the material")
    if (type === "OUT" && qty > current) return setError("Not enough stock to issue that amount")

    try {
      await mutation.mutateAsync({
        materialId: material.id,
        type,
        quantity: qty,
        sectionId: type === "OUT" ? sectionId : undefined,
        unitCost: type === "IN" && unitCost.trim() !== "" ? Number(unitCost) : undefined,
        notes: notes || undefined,
      })
      onClose()
    } catch {
      /* toast handled in hook */
    }
  }

  const needSectionSeed = !sections || sections.length === 0

  return (
    <Modal open={open} onClose={onClose} title="Material Movement" subtitle={material.name} showSeparator={false}>
      <div className="space-y-5 py-2">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">Current stock</span>
          <span className="text-lg font-bold text-gray-900">{current} {material.unit}</span>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Action</Label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${type === t.value ? t.colour : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                {t.icon}
                <span className="text-xs font-semibold">{t.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {type === "OUT" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Issue to section</Label>
            {needSectionSeed ? (
              <p className="text-xs text-amber-600">No sections yet — add sections from the Materials page first.</p>
            ) : (
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm"
              >
                <option value="">Select a section…</option>
                {sections!.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            {type === "ADJUSTMENT" ? `Set stock to (${material.unit})` : `Quantity (${material.unit})`}
          </Label>
          <Input type="number" min={0} step="0.01" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {qty > 0 && (
            <p className="text-xs text-gray-500">
              New stock will be: <span className="font-semibold text-gray-800">{preview} {material.unit}</span>
            </p>
          )}
        </div>

        {type === "IN" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">New unit cost (optional)</Label>
            <Input type="number" min={0} step="0.01" placeholder={`Current: GHS ${material.unitCost}`} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            <p className="text-xs text-gray-400">Set this if the purchase price changed; it updates the material&apos;s unit cost.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            onClick={handleSave}
            disabled={mutation.isPending || (type === "OUT" && needSectionSeed)}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
