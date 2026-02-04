'use client'
import { useQuery } from '@tanstack/react-query'
import { SerializedService } from '../types'
import ServiceCard from './service-card'
import { getServices } from '../client/use-service'

const ServiceList = ({ services }: { services: SerializedService[] }) => {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
    initialData: services,
  })

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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 text-lg font-semibold">No services found</p>
        <p className="text-gray-400 text-sm">Create your first service to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  )
}

export default ServiceList
