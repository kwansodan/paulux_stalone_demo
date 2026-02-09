import ServicesGrid from "@/components/customer/services/service-grid"
import ServicesHeader from "@/components/customer/services/service-header"
import { serviceRepository } from "@/features/service/server/service.repository"

export default async function ServicesPage() {
  const services = await serviceRepository.getAllServices({
    isActive: true,
  })

  return (
    <div className="">
      <ServicesHeader />
      <ServicesGrid services={services} />
    </div>
  )
}
