import CustomerBookingForm from "@/components/customer/booking/customer-booking-form";
import { serviceRepository } from "@/features/service/server/service.repository";

export const dynamic = 'force-dynamic'

export default async function CustomerBookingPage({
  searchParams
}: {
  searchParams: Promise<{ serviceId?: string }>
}) {
  const services = await serviceRepository.getAllServices({})
  const params = await searchParams
  const preSelectedService = params.serviceId || null

  return (
    <div className="p-6">
      <CustomerBookingForm services={services} preSelectedServiceId={preSelectedService} />
    </div>
  )
}