"use client"

import { useRef, useState, useEffect } from "react"
import ServiceCard from "./service-card"
import { SerializedService } from "@/features/service/types"

export default function ServicesCarousel({ services }: { services: SerializedService[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft
      const cardWidth = 280 + 16 // card width + gap
      const index = Math.round(scrollLeft / cardWidth)
      setActiveIndex(index)
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="w-full">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-4">
          {services.map((service) => (
            <div key={service.id} className="shrink-0 w-[280px]">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>

      {/* Indicator dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {services.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const scrollContainer = scrollRef.current
              if (scrollContainer) {
                scrollContainer.scrollTo({
                  left: index * (280 + 16),
                  behavior: "smooth"
                })
              }
            }}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex 
                ? "w-6 bg-fuchsia-600" 
                : "w-1.5 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  )
}