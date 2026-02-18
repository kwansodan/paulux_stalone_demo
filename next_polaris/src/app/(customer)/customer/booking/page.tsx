import CustomerBookingForm from "@/components/customer/booking/customer-booking-form";
import { serviceRepository } from "@/features/service/server/service.repository";

export const dynamic = 'force-dynamic'

export default async function CustomerBookingPage() {
  const services = await serviceRepository.getAllServices({})

  return (
    <div className="p-6">
      <CustomerBookingForm services={services} />
    </div>
  )
}