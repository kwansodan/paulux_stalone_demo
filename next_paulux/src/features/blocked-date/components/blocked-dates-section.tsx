import { Separator } from '@/components/ui/separator'
import { BlockedDate } from '@generated/prisma/client'
import BlockedDateForm from './form/blocked-date-form'
import BlockedDatesList from './blocked-dates-list'

const BlockedDatesSection = ({ blockedDates }: { blockedDates: BlockedDate[] }) => {
  return (
    <div className='w-full h-full flex flex-col gap-2 p-4 border border-gray-200 rounded-3xl'>
      <p className='font-semibold text-xl'>Blocked Dates</p>

      <div className='space-y-4 w-full'>
        <BlockedDateForm />

        <Separator />

        <BlockedDatesList blockedDates={blockedDates}/>
      </div>
    </div>
  )
}

export default BlockedDatesSection
