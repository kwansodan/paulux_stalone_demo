import ServicesGrid from "@/components/customer/services/service-grid"
import ServicesHeader from "@/components/customer/services/service-header"
import { serviceRepository } from "@/features/service/server/service.repository"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const [services, packages] = await Promise.all([
    serviceRepository.getAllServices({ isActive: true }),
    prisma.servicePackage.findMany({
      where: { isActive: true },
      include: { services: { include: { service: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const serializedPackages = packages.map((pkg) => ({
    ...pkg,
    price: pkg.price.toString(),
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
    services: pkg.services.map((ps) => ({
      ...ps,
      service: {
        ...ps.service,
        price: ps.service.price.toString(),
        createdAt: ps.service.createdAt.toISOString(),
        updatedAt: ps.service.updatedAt.toISOString(),
      },
    })),
  }))

  return (
    <div className="">
      <ServicesHeader />
      <ServicesGrid services={services} packages={serializedPackages} />
    </div>
  )
}
