import { customerBookingPath } from "@/app/paths";
import { SerializedService } from "@/features/service/types"
import { formatDurationShort } from "@/features/service/utils/helpers"
import { ArrowRight, Timer } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({ service }: { service: SerializedService }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 group">
      {/* Left — name, duration, description */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Timer className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{formatDurationShort(service.durationMinutes)}</span>
        </div>
        {service.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>
        )}
      </div>

      {/* Right — price + book */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
          GHS {Number(service.price).toFixed(2)}
        </p>
        <Link
          href={customerBookingPath(service.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-medium rounded-full transition-colors whitespace-nowrap"
        >
          Book
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
