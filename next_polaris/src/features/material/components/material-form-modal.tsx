"use client"

import { useEffect, useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MATERIAL_UNITS } from "@/features/material/utils/validation"
import { useUpsertMaterial } from "@/features/material/client/use-materials"
import { SerializedMaterial } from "@/features/material/types"

type Props = {
  open: boolean
  onClose: () => void
  material?: SerializedMaterial | null
}

export default function MaterialFormModal({ open, onClose, material }: Props) {
  const isEdit = !!material
  const mutation = useUpsertMaterial()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState<string>(MATERIAL_UNITS[0])
  const [unitCost, setUnitCost] = useState("")
  const [lowStockThreshold, setLowStockThreshold] = useState("0")
  const [trackStock, setTrackStock] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(material?.name ?? "")
      setDescription(material?.description ?? "")
      setUnit(material?.unit ?? MATERIAL_UNITS[0])
      setUnitCost(material ? String(material.unitCost) : "")
      setLowStockThreshold(material ? String(material.lowStockThreshold) : "0")
      setTrackStock(material?.trackStock ?? true)
      setError(null)
    }
  }, [open, material])

  const handleSave = async () => {
    if (!name.trim()) return setError("Material name is required")
    const cost = Number(unitCost)
    if (isNaN(cost) || cost < 0) return setError("Enter a valid unit cost")

    await mutation.mutateAsync({
      ...(material ? { id: material.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      unit,
      unitCost: cost,
      lowStockThreshold: Number(lowStockThreshold) || 0,
      trackStock,
      isActive: material?.isActive ?? true,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Material" : "Add Material"}
      subtitle="Internal consumable issued to sections"
      showSeparator={false}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Name</Label>
          <Input placeholder="e.g. Acetone, Gel polish, Hair dye" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Unit</Label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm"
            >
              {MATERIAL_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Unit cost (GHS)</Label>
            <Input type="number" min={0} step="0.01" placeholder="0.00" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Low-stock threshold</Label>
          <Input type="number" min={0} step="0.01" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
          <p className="text-xs text-gray-400">Alert admins when stock drops to this level. Set 0 to disable.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={trackStock} onChange={(e) => setTrackStock(e.target.checked)} className="h-4 w-4" />
          Track stock for this material
        </label>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Description (optional)</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
