import { PackageX, AlertTriangle } from "lucide-react"

type StockItem = {
  id: string
  name: string
  stockQuantity: number
  lowStockThreshold: number
  category: { name: string } | null
}

type Props = {
  outOfStock: StockItem[]
  lowStock: StockItem[]
}

function Row({ item, isOut }: { item: StockItem; isOut: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isOut ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
        }`}>
          {isOut ? <PackageX className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{item.name}</p>
          {item.category && <p className="text-xs text-gray-400">{item.category.name}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold ${isOut ? "text-red-600" : "text-amber-600"}`}>
        {isOut ? "0 units" : `${item.stockQuantity} left`}
      </span>
    </div>
  )
}

export default function OutOfStockPanel({ outOfStock, lowStock }: Props) {
  if (outOfStock.length === 0 && lowStock.length === 0) return null

  return (
    <div className="bg-white rounded-xl border p-4 sm:p-5 space-y-5">
      {outOfStock.length > 0 && (
        <div>
          <h2 className="font-semibold text-base sm:text-lg mb-1 text-red-700">Out of Stock</h2>
          <p className="text-xs text-gray-400 mb-3">These products have zero units remaining</p>
          {outOfStock.map(item => <Row key={item.id} item={item} isOut />)}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className={outOfStock.length > 0 ? "border-t pt-5" : ""}>
          <h2 className="font-semibold text-base sm:text-lg mb-1 text-amber-700">Low Stock</h2>
          <p className="text-xs text-gray-400 mb-3">These products are below their restock threshold</p>
          {lowStock.map(item => <Row key={item.id} item={item} isOut={false} />)}
        </div>
      )}
    </div>
  )
}
