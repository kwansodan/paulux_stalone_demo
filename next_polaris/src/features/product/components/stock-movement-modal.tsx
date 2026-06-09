"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react"
import { SerializedProduct } from "../types"
import { useRecordStockMovement } from "../client/use-product-stock"

type MovementType = "IN" | "OUT" | "ADJUSTMENT"

type Props = {
  product: SerializedProduct
  open: boolean
  onClose: () => void
}

const TYPES: { value: MovementType; label: string; description: string; icon: React.ReactNode; colour: string }[] = [
  {
    value: "IN",
    label: "Stock In",
    description: "Add units to inventory",
    icon: <ArrowDownCircle className="w-4 h-4" />,
    colour: "border-green-500 bg-green-50 text-green-700",
  },
  {
    value: "OUT",
    label: "Stock Out",
    description: "Remove units from inventory",
    icon: <ArrowUpCircle className="w-4 h-4" />,
    colour: "border-red-400 bg-red-50 text-red-700",
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    description: "Set exact stock count",
    icon: <SlidersHorizontal className="w-4 h-4" />,
    colour: "border-blue-400 bg-blue-50 text-blue-700",
  },
]

export default function StockMovementModal({ product, open, onClose }: Props) {
  const [type, setType] = useState<MovementType>("IN")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const mutation = useRecordStockMovement()

  const handleSave = async () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0 || !Number.isInteger(qty)) return
    await mutation.mutateAsync({ productId: product.id, type, quantity: qty, notes: notes || undefined })
    setQuantity("")
    setNotes("")
    onClose()
  }

  const preview =
    type === "IN"
      ? product.stockQuantity + (Number(quantity) || 0)
      : type === "OUT"
      ? Math.max(0, product.stockQuantity - (Number(quantity) || 0))
      : Number(quantity) || 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Stock Movement"
      subtitle={product.name}
      childrenClassName="max-h-[500px]"
      showSeparator={false}
    >
      <div className="space-y-5 py-2">

        {/* Current stock */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">Current stock</span>
          <span className="text-lg font-bold text-gray-900">{product.stockQuantity} units</span>
        </div>

        {/* Movement type */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Movement type</Label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                  type === t.value ? t.colour : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {t.icon}
                <span className="text-xs font-semibold">{t.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            {type === "ADJUSTMENT" ? "Set stock to" : "Quantity"}
          </Label>
          <Input
            type="number"
            min={1}
            step={1}
            placeholder="0"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="h-11 bg-white border-[#E2E8F0] rounded-lg shadow-none"
          />
          {quantity && Number(quantity) > 0 && (
            <p className="text-xs text-gray-500">
              New stock will be: <span className="font-semibold text-gray-800">{preview} units</span>
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Notes (optional)</Label>
          <Textarea
            placeholder="e.g. Restock from supplier, damaged units removed..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="bg-white border-[#E2E8F0] rounded-lg shadow-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            onClick={handleSave}
            disabled={mutation.isPending || !quantity || Number(quantity) <= 0}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
