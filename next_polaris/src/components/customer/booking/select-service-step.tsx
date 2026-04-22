"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SerializedService } from "@/features/service/types"
import { SerializedPackage } from "@/features/package/types"
import { Search, Plus, Trash2, Package, X } from "lucide-react"

type Props = {
  services: SerializedService[]
  packages: SerializedPackage[]
  selectedServiceIds: string[]
  selectedPackage: SerializedPackage | null
  onSelectService: (service: SerializedService) => void
  onSelectPackage: (pkg: SerializedPackage | null) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export default function SelectServiceStep({
  services,
  packages,
  selectedServiceIds,
  selectedPackage,
  onSelectService,
  onSelectPackage,
  onNext,
  onBack,
  canProceed,
}: Props) {
  const [showAllServices, setShowAllServices] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const selectedServicesList = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  )

  // Derive unique categories from the full services list
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    services.forEach((s) => {
      if (s.category && !seen.has(s.category.id)) {
        seen.set(s.category.id, s.category.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [services])

  const filteredServices = useMemo(() => {
    let result = services
    if (activeCategory) result = result.filter((s) => s.category?.id === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.description?.toLowerCase() || "").includes(q)
      )
    }
    return result
  }, [services, searchQuery, activeCategory])

  const availableServices = filteredServices.filter((s) => !selectedServiceIds.includes(s.id))

  const activePackages = packages.filter((p) => p.isActive)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Select Services</h2>
        <p className="text-gray-500">Choose a package or individual services</p>
      </div>

      {/* ── Packages section ── */}
      {activePackages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-fuchsia-600" />
            Packages
          </p>

          {/* Selected package display */}
          {selectedPackage ? (
            <div className="flex items-start justify-between p-4 rounded-xl border-2 border-fuchsia-500 bg-fuchsia-50/40">
              <div className="flex gap-3">
                {selectedPackage.imageUrl && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={selectedPackage.imageUrl} alt={selectedPackage.name} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{selectedPackage.name}</p>
                  <p className="text-sm text-fuchsia-600 font-medium mt-0.5">
                    GHS {Number(selectedPackage.price).toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPackage.services.map((ps) => (
                      <span key={ps.serviceId} className="text-[10px] bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded-full">
                        {ps.service.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectPackage(null)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Remove package"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {activePackages.map((pkg) => {
                const individualTotal = pkg.services.reduce((sum, ps) => sum + Number(ps.service.price), 0)
                const savings = individualTotal - Number(pkg.price)
                const totalMins = pkg.services.reduce((sum, ps) => sum + ps.service.durationMinutes, 0)
                return (
                  <div
                    key={pkg.id}
                    onClick={() => onSelectPackage(pkg)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50/20 cursor-pointer transition-colors"
                  >
                    {pkg.imageUrl && (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{pkg.name}</p>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-fuchsia-600">GHS {Number(pkg.price).toFixed(2)}</p>
                          {savings > 0 && (
                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Save ₵{savings.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {pkg.services.map((ps) => (
                          <span key={ps.serviceId} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                            {ps.service.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{totalMins} mins total</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!selectedPackage && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-100" />
              <span>or choose individual services</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          )}
        </div>
      )}

      {/* ── Individual services ── (hidden when a package is selected) */}
      {!selectedPackage && (
        <>
          <div className="space-y-3">
            {selectedServicesList.length > 0 ? (
              selectedServicesList.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50/30"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.category && (
                      <span className="text-[11px] text-gray-400">{service.category.name}</span>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span className="font-medium text-fuchsia-600">GHS {Number(service.price).toFixed(2)}</span>
                      <span>|</span>
                      <span>{service.durationMinutes} mins</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectService(service)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
              Add services
            </Button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 rounded-xl border-gray-200"
                />
              </div>

              {/* Category tabs */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeCategory === null
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === cat.id
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => onSelectService(service)}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-fuchsia-200 hover:bg-pink-50/30 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
                      {service.category && (
                        <span className="text-[11px] text-gray-400">{service.category.name}</span>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                        <span className="font-medium text-fuchsia-600">GHS {Number(service.price).toFixed(2)}</span>
                        <span>|</span>
                        <span>{service.durationMinutes} mins</span>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="rounded-full bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
                {availableServices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery.trim() ? "No matching services found." : "No more services available."}
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAllServices(false); setSearchQuery(""); setActiveCategory(null) }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close list
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 pt-6">
        <Button onClick={onBack} variant="outline" className="flex-1 h-14 rounded-full text-base font-medium border-gray-200">Back</Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 h-14 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full text-base font-medium">
          Continue
        </Button>
      </div>
    </div>
  )
}
