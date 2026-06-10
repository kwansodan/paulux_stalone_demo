"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../client/use-product"
import { SerializedProduct } from "../types"
import StockMovementModal from "./stock-movement-modal"
import StockHistoryModal from "./stock-history-modal"
import { AlertTriangle, PackageX, History, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  initialProducts: SerializedProduct[]
}

function stockStatus(product: SerializedProduct) {
  if (product.stockQuantity <= 0) return "out"
  if (product.stockQuantity <= product.lowStockThreshold) return "low"
  return "ok"
}

export default function StockManagementShell({ initialProducts }: Props) {
  const { data: products = initialProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    initialData: initialProducts,
  })

  const [movementTarget, setMovementTarget] = useState<SerializedProduct | null>(null)
  const [historyTarget, setHistoryTarget] = useState<SerializedProduct | null>(null)

  const trackedProducts = products.filter(p => (p as any).trackStock)
  const sorted = [...trackedProducts].sort((a, b) => {
    const order = { out: 0, low: 1, ok: 2 }
    return order[stockStatus(a)] - order[stockStatus(b)]
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Track inventory levels for products with stock tracking enabled. To add products here, enable &quot;Track inventory&quot; on the product in the Products tab.
      </p>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Threshold</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map(product => {
              const status = stockStatus(product)
              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-base ${
                      status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-gray-900"
                    }`}>
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{product.lowStockThreshold}</td>
                  <td className="px-4 py-3 text-center">
                    {status === "out" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <PackageX className="w-3 h-3" />
                        Out of stock
                      </span>
                    ) : status === "low" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        Low stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setHistoryTarget(product)}
                      >
                        <History className="w-3 h-3" />
                        History
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1 text-xs bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                        onClick={() => setMovementTarget(product)}
                      >
                        <Plus className="w-3 h-3" />
                        Update
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="text-gray-500 font-medium text-sm">No tracked products</p>
                  <p className="text-gray-400 text-xs mt-1">Enable &quot;Track inventory&quot; on a product to manage its stock here.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {movementTarget && (
        <StockMovementModal
          product={movementTarget}
          open={!!movementTarget}
          onClose={() => setMovementTarget(null)}
        />
      )}

      {historyTarget && (
        <StockHistoryModal
          product={historyTarget}
          open={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
