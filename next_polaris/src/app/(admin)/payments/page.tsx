export const dynamic = "force-dynamic"

import { requireRole } from "@/app/_auth/require-role"
import { paymentRepository } from "@/features/payment/server/payment.repository"
import PaymentsPageContent from "@/features/payment/components/payments-page-content"
import { serviceRepository } from "@/features/service/server/service.repository"
import { gatewayMetricsService } from "@/features/payment/server/gateway-metrics.service"
import { UserRole } from "@generated/prisma/client"

export default async function PaymentsPage() {
  await requireRole([UserRole.ADMIN], "payments.view")

  const metrics = await paymentRepository.getMetrics()
  const services = await serviceRepository.getAllServices({})
  const gatewayMetrics = await gatewayMetricsService.getMetrics()

  return (
    <PaymentsPageContent
      gatewayMetrics={{
        primaryNetTotal: gatewayMetrics.primary.totalAmount,
        secondaryNetTotal: gatewayMetrics.secondary.totalAmount,
        primaryPercentage: gatewayMetrics.primary.percentage,
        secondaryPercentage: gatewayMetrics.secondary.percentage,
        routingThreshold: gatewayMetrics.routingThreshold,
        primaryLastWebhookAt: gatewayMetrics.primary.lastWebhookAt?.toISOString() ?? null,
        secondaryLastWebhookAt: gatewayMetrics.secondary.lastWebhookAt?.toISOString() ?? null,
      }}
      initialMetrics={metrics}
      services={services}
    />
  )
}
