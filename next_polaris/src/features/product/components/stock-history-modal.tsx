"use client"

import Modal from "@/components/modal"
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ShoppingCart, RotateCcw, Loader2 } from "lucide-react"
import { SerializedProduct, StockMovement } from "../types"
import { useGetStockMovements } from "../client/use-product-stock"

type Props = {
  product: SerializedProduct
  open: boolean
  onClose: () => void
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; colour: string }> = {
  IN:            { label: "In",            icon: <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" />,  colour: "text-green-700 bg-green-50" },
  OUT:           { label: "Out",           icon: <ArrowUpCircle   className="w-3.5 h-3.5 text-red-600" />,    colour: "text-red-700 bg-red-50" },
  ADJUSTMENT:    { label: "Adjustment",    icon: <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />, colour: "text-blue-700 bg-blue-50" },
  SALE:          { label: "Sale",          icon: <ShoppingCart className="w-3.5 h-3.5 text-red-600" />,       colour: "text-red-700 bg-red-50" },
  SALE_REVERSAL: { label: "Sale reversal", icon: <RotateCcw className="w-3.5 h-3.5 text-green-600" />,         colour: "text-green-700 bg-green-50" },
}

// Adjustments are relative +/- corrections, so show the sign. Other types carry
// their direction in the label/icon, so show the bare magnitude.
function formatQuantity(type: string, quantity: number): string {
  if (type === "ADJUSTMENT") {
    const abs = Math.abs(quantity)
    const unit = abs === 1 ? "unit" : "units"
    return `${quantity > 0 ? "+" : "−"}${abs} ${unit}`
  }
  const abs = Math.abs(quantity)
  return `${abs} unit${abs === 1 ? "" : "s"}`
}

export default function StockHistoryModal({ product, open, onClose }: Props) {
  const { data: movements = [], isLoading } = useGetStockMovements(product.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Stock History"
      subtitle={product.name}
      childrenClassName="max-h-[460px]"
      showSeparator={false}
    >
      <div className="space-y-3 py-2">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-500">Current stock</span>
          <span className="text-lg font-bold text-gray-900">{product.stockQuantity} units</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : movements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No movements recorded yet.</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {movements.map((m: StockMovement) => {
              const cfg = TYPE_CONFIG[m.type] ?? TYPE_CONFIG.ADJUSTMENT
              const date = new Date(m.createdAt)
              return (
                <div key={m.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.colour}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {cfg.label} &mdash; {formatQuantity(m.type, m.quantity)}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {m.notes && <p className="text-xs text-gray-500 mt-0.5">{m.notes}</p>}
                    {m.createdBy && (
                      <p className="text-xs text-gray-400 mt-0.5">by {m.createdBy.username}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
