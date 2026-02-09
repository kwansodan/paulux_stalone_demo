import { SerializedService } from "../../../features/service/types"
import ServiceCard from "./service-card"

export default function ServicesGrid({
  services,
}: {
  services: SerializedService[]
}) {
  if (!services.length) {
    return (
      <div className="py-20 text-center text-gray-500">
        No services available at the moment
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
          />
        ))}
      </div>
    </div>
  )
}
