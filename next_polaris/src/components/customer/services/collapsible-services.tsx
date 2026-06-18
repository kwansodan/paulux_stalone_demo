"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { SerializedService } from "@/features/service/types"
import ServiceCard from "./service-card"

export type ServiceGroup = {
  name: string | null
  services: SerializedService[]
}

/**
 * Renders services grouped by category, but collapsed to the first `limit`
 * items to keep the page short. A "See all" button rolls out the rest;
 * "Show less" collapses again. Grouping/order is preserved when expanding.
 */
export default function CollapsibleServices({
  groups,
  limit = 5,
}: {
  groups: ServiceGroup[]
  limit?: number
}) {
  const [showAll, setShowAll] = useState(false)

  const total = groups.reduce((n, g) => n + g.services.length, 0)
  if (total === 0) return null

  // Walk the groups, showing items up to the limit (unless expanded).
  let remaining = showAll ? Infinity : limit

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {groups.map((group) => {
          if (remaining <= 0) return null
          const visible = group.services.slice(0, remaining)
          remaining -= visible.length
          if (visible.length === 0) return null

          return (
            <div key={group.name ?? "__flat__"}>
              {group.name && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {group.name}
                </p>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 px-4">
                {visible.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {total > limit && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          {showAll ? (
            <>
              Show less
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              See all {total} services
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
