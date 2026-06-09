import { requireRole } from '@/app/_auth/require-role'
import ServicesClientShell from '@/features/service/components/services-client-shell'
import { serviceRepository } from '@/features/service/server/service.repository'
import { UserRole } from '@generated/prisma/client'
import { prisma } from '@/lib/prisma'
import React from 'react'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  await requireRole([UserRole.ADMIN], "services.view")

  const [services, packages] = await Promise.all([
    serviceRepository.getAllServices({}),
    prisma.servicePackage.findMany({
      include: { services: { include: { service: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const serializedPackages = packages.map((pkg) => ({
    ...pkg,
    price: pkg.price.toString(),
    minDepositFixed: Number(pkg.minDepositFixed),
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
    services: pkg.services.map((ps) => ({
      ...ps,
      service: {
        ...ps.service,
        price: ps.service.price.toString(),
        minDepositFixed: Number(ps.service.minDepositFixed),
        createdAt: ps.service.createdAt.toISOString(),
        updatedAt: ps.service.updatedAt.toISOString(),
      },
    })),
  }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <ServicesClientShell initialServices={services} initialPackages={serializedPackages} />
    </div>
  )
}

