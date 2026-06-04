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
    let result = services.filter(s => s.isActive)
    if (activeCategory) result = result.filter((s) => s.category?.id === activeCategory)
    if (searchTerm) result = result.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    return result
  }, [searchTerm, activeCategory, services])

  // Group services by category for the "All" view
  const grouped = useMemo(() => {
    if (activeCategory || searchTerm) return null
    const map = new Map<string, { name: string; services: SerializedService[] }>()
    const uncategorised: SerializedService[] = []

    filteredServices.forEach((s) => {
      if (s.category) {
        if (!map.has(s.category.id)) {
          map.set(s.category.id, { name: s.category.name, services: [] })
        }
        map.get(s.category.id)!.services.push(s)
      } else {
        uncategorised.push(s)
      }
    })

    const groups = Array.from(map.values())
    if (uncategorised.length) groups.push({ name: "Other", services: uncategorised })
    return groups
  }, [filteredServices, activeCategory, searchTerm])

  const tabClass = (active: boolean) =>
    `flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-fuchsia-600 text-white"
        : "text-gray-600 hover:text-gray-900 border border-gray-200 bg-white"
    }`

  return (
    <div className="w-full space-y-4 px-4 pb-6">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setActiveCategory(null)} className={tabClass(activeCategory === null)}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={tabClass(activeCategory === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filteredServices.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">No services found</div>
      ) : grouped ? (
        /* All tab — grouped by category */
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.name}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                {group.name}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 px-4">
                {group.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single category or search — flat list */
        <div className="bg-white rounded-2xl border border-gray-100 px-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}
