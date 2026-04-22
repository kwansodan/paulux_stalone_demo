'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SerializedService } from '../types'
import ServiceCard from './service-card'
import { getServices } from '../client/use-service'

const ServiceList = ({ services, searchQuery }: { services: SerializedService[], searchQuery?: string }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
    initialData: services,
  })

  // Derive unique categories from the full service list
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    data.forEach((s) => {
      if (s.category && !seen.has(s.category.id)) {
        seen.set(s.category.id, s.category.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 text-lg font-semibold mb-2">Failed to load services</p>
        <p className="text-gray-600 text-sm">{error?.message}</p>
      </div>
    )
  }

  const filteredServices = data.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      (service.description && service.description.toLowerCase().includes(searchQuery?.toLowerCase() || ''))
    const matchesCategory = activeCategory ? service.category?.id === activeCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* ── Category tabs — matches admin Services/Packages tab style ── */}
      {categories.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide max-w-full">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 text-lg font-semibold">No services found</p>
          <p className="text-gray-400 text-sm">
            {searchQuery || activeCategory
              ? "Try a different search term or category"
              : "Create your first service to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ServiceList
