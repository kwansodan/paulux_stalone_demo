"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import ServiceCard from "./service-card"
import { SerializedService } from "@/features/service/types"
import SearchBar from "./SearchBar"

export default function ServicesCarousel({ services }: { services: SerializedService[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Derive unique categories from services
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

  // Reset scroll + active dot whenever the filtered list changes
  useEffect(() => {
    setActiveIndex(0)
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
  }, [activeCategory, searchTerm])

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const cardWidth = 280 + 16 // card width + gap
      setActiveIndex(Math.round(scrollContainer.scrollLeft / cardWidth))
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="w-full space-y-4">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* ── Category tabs ── */}
      {categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-fuchsia-600 text-white"
                : "text-gray-500 hover:text-gray-900"
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
                  ? "bg-fuchsia-600 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filteredServices.length > 0 ? (
        <>
          <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 pb-4">
              {filteredServices.map((service) => (
                <div key={service.id} className="shrink-0 w-[280px]">
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          </div>

          {/* Indicator dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {filteredServices.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    left: index * (280 + 16),
                    behavior: "smooth",
                  })
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-6 bg-fuchsia-600" : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-gray-400 text-sm">
          No services found
        </div>
      )}
    </div>
  )
}
