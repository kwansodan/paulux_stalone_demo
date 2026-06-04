import { customerBookingPath } from "@/app/paths";
import { SerializedService } from "@/features/service/types"
import { formatDurationShort } from "@/features/service/utils/helpers"
import { ArrowRight, Timer } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({ service }: { service: SerializedService }) {
  const hasDeposit = Number(service.minDepositFixed) > 0

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors -mx-4 px-4">
      {/* Left — name, duration + price together, deposit badge */}
      <div className="flex-1 min-w-0 pr-6">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{service.name}</p>

        <div className="flex items-center gap-1.5 mt-1">
          <Timer className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500">{formatDurationShort(service.durationMinutes)}</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs font-semibold text-gray-800">
            GHS {Number(service.price).toFixed(2)}
          </span>
        </div>

        {hasDeposit && (
          <span className="inline-block mt-1.5 text-[10px] font-medium text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2 py-0.5 rounded-full">
            GHS {Number(service.minDepositFixed).toFixed(2)} deposit
          </span>
        )}
      </div>

      {/* Right — Book button only */}
      <Link
        href={customerBookingPath(service.id)}
        className="flex items-center gap-1.5 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0"
      >
        Book
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
