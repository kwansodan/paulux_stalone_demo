"use client"

import { useState, useMemo } from "react"
import { SerializedService } from "../../../features/service/types"
import ServiceCard from "./service-card"
import SearchBar from "./SearchBar"

export default function ServicesGrid({
  services,
}: {
  services: SerializedService[]
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredServices = useMemo(() =>
    services.filter((service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [searchTerm, services]
  )

  if (!services.length) {
    return (
      <div className="py-20 text-center text-gray-500">
        No services available at the moment
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {filteredServices.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          No services match your search
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </div>
      )}
    </div>
  )
}
