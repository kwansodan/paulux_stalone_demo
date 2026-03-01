"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import PaymentMetrics from "./payment-metrics"
import PaymentManager from "./payment-manager"
import { GatewayPaymentMetrics as IGatewayPaymentMetrics, PaymentMetrics as IPaymentMetrics } from "../types"
import { SerializedService } from "@/features/service/types"
import GatewayPaymentMetrics from "./gateway-payment-metrics"
import GatewayDistribution from "./gateway-distribution"
import GatewayAllocationPolicy from "./gateway-allocation-policy"
import GatewayControlCards from "./gateway-control-cards"
import GatewayAllocationActivity from "./gateway-allocation-activity"

export type PaymentsView = "collections" | "gateway-routing"

type PaymentsPageContentProps = {
  initialMetrics: IPaymentMetrics
  gatewayMetrics: IGatewayPaymentMetrics
  services: SerializedService[]
}

export default function PaymentsPageContent({
  initialMetrics,
  gatewayMetrics,
  services,
}: PaymentsPageContentProps) {
  const [view, setView] = useState<PaymentsView>("collections")

  return (
    <div className="space-y-6 p-6">
      {/* Toggle: Collections | Gateway routing */}
      <div className="flex items-center gap-0 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setView("collections")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            view === "collections"
              ? "bg-fuchsia-700 text-primary-foreground shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Collections
        </button>
        <button
          type="button"
          onClick={() => setView("gateway-routing")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            view === "gateway-routing"
              ? "bg-fuchsia-700 text-primary-foreground shadow-sm ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Gateway routing
        </button>
      </div>

      {view === "collections" && (
        <>
          <PaymentMetrics initialMetrics={initialMetrics} />
          <PaymentManager services={services} />
        </>
      )}

      {view === "gateway-routing" && (
        <div className="space-y-6">
          <GatewayPaymentMetrics initialMetrics={gatewayMetrics} />
          <GatewayAllocationActivity />
        </div>
      )}
    </div>
  )
}
