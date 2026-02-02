import { BusinessHour } from '@generated/prisma/client'
import BusinessHoursList from './business-hours-list'

const BusinessHoursSection = ({ businessHours }: { businessHours: BusinessHour[] }) => {
  return (
    <div className='flex flex-col gap-2 p-4 border border-gray-200 rounded-3xl'>
     <p className='font-semibold text-xl'>Business Hours</p> 

     <BusinessHoursList businessHours={businessHours}/>
    </div>
  )
}

export default BusinessHoursSection
