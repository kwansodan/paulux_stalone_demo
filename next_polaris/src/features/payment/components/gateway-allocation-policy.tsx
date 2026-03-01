"use client"

import { useState, useEffect } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUpdateGatewayThreshold } from "../client/use-payment"

const DEFAULT_PRIMARY_TARGET = 60

type GatewayAllocationPolicyProps = {
  routingThreshold: number
  isSaving?: boolean
}

export default function GatewayAllocationPolicy({
  routingThreshold,
  isSaving = false,
}: GatewayAllocationPolicyProps) {
  const [primaryTarget, setPrimaryTarget] = useState(routingThreshold)
  const updateThreshold = useUpdateGatewayThreshold()

  useEffect(() => {
    setPrimaryTarget(routingThreshold)
  }, [routingThreshold])

  const secondaryTarget = 100 - primaryTarget

  const handleSave = () => {
    updateThreshold.mutate(primaryTarget)
  }

  const handleReset = () => {
    setPrimaryTarget(DEFAULT_PRIMARY_TARGET)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-gray-600" />
        <h3 className="text-base font-semibold text-gray-900">Allocation Policy</h3>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Controls how new payments are routed between gateways.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 gap-2.5 flex flex-col justify-center items-center p-2 rounded-lg">
          <p className="text-xs font-medium text-gray-500">Primary Paystack target (%)</p>
          <p className="mt-0.5 text-2xl font-semibold text-gray-900  rounded-lg border border-gray-200 py-2.5 px-4">{primaryTarget}%</p>
        </div>
        <div className="bg-gray-50 gap-2.5 flex flex-col justify-center items-center p-2 rounded-lg">
          <p className="text-xs font-medium text-gray-500">Secondary Paystack target (%)</p>
          <p className="mt-0.5 text-2xl font-semibold text-gray-900 rounded-lg border border-gray-200 py-2.5 px-4">{secondaryTarget}%</p>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={100}
          value={primaryTarget}
          onChange={(e) => {
            const v = Number(e.target.value)
            setPrimaryTarget(v)
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-fuchsia-600"
        />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Applies to new payments only. Existing invoices keep the target used at the time they were
        created.
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset to default (60/40)
        </Button>
        <Button
          size="sm"
          className="bg-fuchsia-600 hover:bg-fuchsia-700"
          onClick={handleSave}
          disabled={updateThreshold.isPending || isSaving}
        >
          {updateThreshold.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
