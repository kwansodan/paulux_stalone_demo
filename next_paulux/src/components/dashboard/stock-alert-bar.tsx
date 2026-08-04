import { PackageX, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { productsPath } from "@/app/paths"

type Props = {
  outOfStockCount: number
  lowStockCount: number
}

export default function StockAlertBar({ outOfStockCount, lowStockCount }: Props) {
  if (outOfStockCount === 0 && lowStockCount === 0) return null

  const isUrgent = outOfStockCount > 0
  const parts: string[] = []
  if (outOfStockCount > 0) parts.push(`${outOfStockCount} product${outOfStockCount > 1 ? "s" : ""} out of stock`)
  if (lowStockCount > 0) parts.push(`${lowStockCount} running low`)

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
      isUrgent
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200"
    }`}>
      <div className="flex items-center gap-2.5">
        {isUrgent
          ? <PackageX className="w-4 h-4 text-red-600 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        }
        <span className={`text-sm font-medium ${isUrgent ? "text-red-800" : "text-amber-800"}`}>
          {parts.join(" · ")}
        </span>
      </div>
      <Link
        href={productsPath()}
        className={`flex items-center gap-1 text-xs font-semibold hover:underline flex-shrink-0 ${
          isUrgent ? "text-red-600" : "text-amber-700"
        }`}
      >
        View Products <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
