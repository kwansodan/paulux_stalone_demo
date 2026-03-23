import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SerializedService } from "@/features/service/types"

type Props = {
  services: SerializedService[]
  selectedServiceIds: string[]
  onSelectService: (service: SerializedService) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export default function SelectServiceStep({
  services,
  selectedServiceIds,
  onSelectService,
  onNext,
  onBack,
  canProceed,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Select Services</h2>
        <p className="text-gray-500">You can choose multiple services for your booking</p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`
                relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
                ${isSelected
                  ? 'border-fuchsia-600 bg-fuchsia-50/50 shadow-md'
                  : 'border-gray-100 hover:border-fuchsia-200 bg-white shadow-sm'}
              `}
            >
              <div className="flex-1 min-w-0 pr-4">
                <h3 className={`font-semibold text-lg truncate ${isSelected ? 'text-fuchsia-900' : 'text-gray-900'}`}>
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">{service.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm font-medium text-fuchsia-600">GHS {Number(service.price).toFixed(2)}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-400 capitalize">{service.durationMinutes} mins</span>
                </div>
              </div>

              <div className={`
                flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors
                ${isSelected ? 'bg-fuchsia-600 border-fuchsia-600' : 'border-gray-200'}
              `}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Decorative gradient for selected state */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-fuchsia-100/30 to-transparent pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-14 rounded-full text-base font-medium border-gray-200"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}