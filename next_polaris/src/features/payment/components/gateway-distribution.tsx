"use client"

type GatewayDistributionProps = {
  primaryPercentage: number
  secondaryPercentage: number
  /** Target threshold (e.g. 60) shown as vertical line on bar */
  targetPercent?: number
  primaryLabel?: string
  secondaryLabel?: string
}

export default function GatewayDistribution({
  primaryPercentage,
  secondaryPercentage,
  targetPercent = 60,
  primaryLabel = "Primary Paystack",
  secondaryLabel = "Secondary Paystack",
}: GatewayDistributionProps) {
  const primary = Math.min(100, Math.max(0, primaryPercentage))
  const secondary = Math.min(100, Math.max(0, secondaryPercentage))
  const total = primary + secondary
  const primaryShare = total > 0 ? (primary / total) * 100 : 50
  const secondaryShare = total > 0 ? (secondary / total) * 100 : 50

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">Distribution</h3>
      <div className="relative mt-3 flex h-8 w-full overflow-hidden rounded-lg bg-gray-100">
        <div
          className="bg-[#7C3AED] transition-all duration-300"
          style={{ width: `${primaryShare}%` }}
          title={`${primaryLabel} (${primaryPercentage.toFixed(1)}%)`}
        />
        <div
          className="bg-fuchsia-600 transition-all duration-300"
          style={{ width: `${secondaryShare}%` }}
          title={`${secondaryLabel} (${secondaryPercentage.toFixed(1)}%)`}
        />
        {targetPercent > 0 && targetPercent < 100 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-500"
            style={{ left: `${targetPercent}%`, transform: "translateX(-50%)" }}
            title={`Target ${targetPercent}%`}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{primaryShare.toFixed(1)}%</span>
        <span>{secondaryShare.toFixed(1)}%</span>
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
          {primaryLabel} ({primaryPercentage.toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-600" />
          {secondaryLabel} ({secondaryPercentage.toFixed(1)}%)
        </span>
      </div>
      <p className="mt-3 text-sm text-gray-600">
        Rule: If Primary% &lt; {targetPercent}%, new bookings route to {primaryLabel}. Otherwise
        route to {secondaryLabel}.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Allocation totals use completed initial invoices only. Refunds subtract. Top-ups excluded.
        Timezone: Africa/Accra.
      </p>
    </div>
  )
}
