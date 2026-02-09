import { requireRole } from '@/app/_auth/require-role'
import ServicesHeader from '@/features/service/components/service-header'
import ServiceList from '@/features/service/components/service-list'
import { serviceRepository } from '@/features/service/server/service.repository'
import { UserRole } from '@generated/prisma/client'
import React from 'react'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  await requireRole([UserRole.ADMIN])
  const services = await serviceRepository.getAllServices({})

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">

      <ServicesHeader />

      <ServiceList services={services} />

    </div>
  )
}

