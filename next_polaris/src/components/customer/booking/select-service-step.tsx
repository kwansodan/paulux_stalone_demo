"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SerializedService } from "@/features/service/types"
import { Search, Plus, Trash2 } from "lucide-react"

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
  const [showAllServices, setShowAllServices] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const selectedServicesList = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id))
  }, [services, selectedServiceIds])

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services
    const query = searchQuery.toLowerCase()
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.description?.toLowerCase() || "").includes(query)
    )
  }, [services, searchQuery])

  // Get services that are not yet selected
  const availableServices = filteredServices.filter(
    (s) => !selectedServiceIds.includes(s.id)
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Selected Services</h2>
        <p className="text-gray-500">Review your selected services or add more</p>
      </div>

      <div className="space-y-3">
        {selectedServicesList.length > 0 ? (
          selectedServicesList.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50/30"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-medium text-fuchsia-600">
                    GHS {Number(service.price).toFixed(2)}
                  </span>
                  <span>|</span>
                  <span>{service.durationMinutes} mins</span>
                </div>
              </div>
              <button
                onClick={() => onSelectService(service)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove service"
                aria-label={`Remove ${service.name}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-6 text-center rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
            No services selected yet.
          </div>
        )}
      </div>

      {!showAllServices ? (
        <Button
          onClick={() => setShowAllServices(true)}
          variant="outline"
          className="w-full py-6 rounded-xl border-dashed border-2 text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add other services
        </Button>
      ) : (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 rounded-xl border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
            />
          </div>

          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
            {availableServices.map((service) => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-fuchsia-200 hover:bg-pink-50/30 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {service.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-medium text-fuchsia-600">
                      GHS {Number(service.price).toFixed(2)}
                    </span>
                    <span>|</span>
                    <span>{service.durationMinutes} mins</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}

            {availableServices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim()
                  ? `No matching services found for "${searchQuery}".`
                  : "No more services available to add."}
              </div>
            )}
          </div>

          {/* Option to hide the services list again */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAllServices(false);
                setSearchQuery("");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Close list
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-6">
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