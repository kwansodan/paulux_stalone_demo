import CustomerBookingForm from "@/components/customer/booking/customer-booking-form";
import { serviceRepository } from "@/features/service/server/service.repository";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export default async function CustomerBookingPage({
  searchParams
}: {
  searchParams: Promise<{ serviceId?: string; packageId?: string }>
}) {
  const params = await searchParams

  const [services, packages] = await Promise.all([
    serviceRepository.getAllServices({}),
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
    <div className="p-6">
      <CustomerBookingForm
        services={services}
        packages={serializedPackages}
        preSelectedServiceId={params.serviceId || null}
        preSelectedPackageId={params.packageId || null}
      />
    </div>
  )
}
