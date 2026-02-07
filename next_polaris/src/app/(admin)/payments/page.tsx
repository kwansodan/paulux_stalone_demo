import { paymentRepository } from "@/features/payment/server/payment.repository"
import PaymentMetrics from "@/features/payment/components/payment-metrics"
import PaymentManager from "@/features/payment/components/payment-manager"
import { serviceRepository } from "@/features/service/server/service.repository"

export default async function PaymentsPage() {
  const metrics = await paymentRepository.getMetrics()
  const services = await serviceRepository.getAllServices({})

  return (
    <div className="space-y-6 p-6">
      <PaymentMetrics initialMetrics={metrics} />

      <PaymentManager services={services} />
    </div>
  )
}
