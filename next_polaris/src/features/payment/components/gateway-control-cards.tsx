"use client"

import { Monitor, Smartphone } from "lucide-react"
import { ToggleSwitch } from "@/features/service/components/toggle-switch"
import { useUpdateGatewayThreshold } from "../client/use-payment"
import { cn } from "@/lib/utils"

const DEFAULT_PRIMARY = 60

function formatLastWebhook(iso: string | null): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return "—"
  }
}

type GatewayControlCardsProps = {
  routingThreshold: number
  primaryLastWebhookAt: string | null
  secondaryLastWebhookAt: string | null
}

export default function GatewayControlCards({
  routingThreshold,
  primaryLastWebhookAt,
  secondaryLastWebhookAt,
}: GatewayControlCardsProps) {
  const updateThreshold = useUpdateGatewayThreshold()

  const primaryOn = routingThreshold > 0
  const secondaryOn = routingThreshold < 100

  const turnPrimaryOn = () => updateThreshold.mutate(DEFAULT_PRIMARY)
  const turnPrimaryOff = () => updateThreshold.mutate(0)
  const turnSecondaryOn = () => updateThreshold.mutate(DEFAULT_PRIMARY)
  const turnSecondaryOff = () => updateThreshold.mutate(100)

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-5",
          !primaryOn && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Primary Paystack</h3>
          </div>
          <ToggleSwitch
            checked={primaryOn}
            onChecked={turnPrimaryOn}
            onUnchecked={turnPrimaryOff}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Last webhook: {formatLastWebhook(primaryLastWebhookAt)}
        </p>
      </div>

      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-5",
          !secondaryOn && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Secondary Paystack</h3>
          </div>
          <ToggleSwitch
            checked={secondaryOn}
            onChecked={turnSecondaryOn}
            onUnchecked={turnSecondaryOff}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Last webhook: {formatLastWebhook(secondaryLastWebhookAt)}
        </p>
      </div>
    </div>
  )
}
