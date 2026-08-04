'use client'

import { BusinessHour } from '@generated/prisma/client'
import { useQuery } from '@tanstack/react-query'
import { getBusinessHours } from '../client/use-business-hour'
import { DAYS } from '@/constants'
import BusinessHourCard from './business-hour-card'


const BusinessHoursList = ({ businessHours }: { businessHours: BusinessHour[] }) => {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["business-hours"],
    queryFn: getBusinessHours,
    initialData: businessHours,
  })
  return (
    <div className="space-y-2">
      {data.map((bh) => (
        <BusinessHourCard
          key={bh.dayOfWeek}
          label={DAYS[bh.dayOfWeek]}
          hour={bh}
        />
      ))}
    </div>
  )
}

export default BusinessHoursList
