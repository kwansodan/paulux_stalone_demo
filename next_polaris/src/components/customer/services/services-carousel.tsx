"use client"

import { useState, useMemo } from "react"
import ServiceCard from "./service-card"
import { SerializedService } from "@/features/service/types"
import SearchBar from "./SearchBar"

export default function ServicesCarousel({ services }: { services: SerializedService[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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
    if (searchTerm) result = result.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    return result
  }, [searchTerm, activeCategory, services])

  return (
    <div className="w-full space-y-4 px-4 pb-6">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 border border-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Vertical services list */}
      {filteredServices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 text-sm">
          No services found
        </div>
      )}
    </div>
  )
}
