"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ToggleSwitch({
  label,
  checked,
  onChecked,
  onUnchecked,
}: {
  label?: string
  checked: boolean
  onChecked?: () => void
  onUnchecked?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      {label && (<Label>{label}</Label>)}
      <Switch
        className="data-[state=checked]:bg-fuchsia-500"
        checked={checked}
        onCheckedChange={(val) => {
          if (val) onChecked?.()
          else onUnchecked?.()
        }}
      />
    </div>
  )
}
