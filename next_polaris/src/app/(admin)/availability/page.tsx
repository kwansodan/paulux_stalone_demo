import { requireRole } from '@/app/_auth/require-role'
import AvailabilityPageHeader from '@/components/availability/availability-page-header'
import BlockedDatesSection from '@/features/blocked-date/components/blocked-dates-section'
import { blockedDateRepository } from '@/features/blocked-date/server/blockedDate.repository'
import BusinessHoursSection from '@/features/business-hour/componenents/business-hours-section'
import { businessHourRepository } from '@/features/business-hour/server/businessHour.repository'
import { UserRole } from '@generated/prisma/client'

export default async function AvailabilityPage() {
  const user = await requireRole([UserRole.ADMIN])
  const businessHours = await businessHourRepository.getAll()
  const blockedDates = await blockedDateRepository.getAll()
  return (
    <div className='w-full p-6'>
      <AvailabilityPageHeader />

      <div className='w-full flex gap-4'>
        <div className='w-1/2 min-h-130 max-w-140'>
          <BusinessHoursSection businessHours={businessHours} />
        </div>
        <div className='w-1/2 min-h-130 max-w-140'>
          <BlockedDatesSection blockedDates={blockedDates}/>
        </div>
      </div>

    </div>
  )
}

