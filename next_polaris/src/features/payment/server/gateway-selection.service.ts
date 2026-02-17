import { PaymentProvider } from "@generated/prisma/client"
import { paymentAllocationService } from "./payment-allocation.service"
import { gatewayMetricsService } from "./gateway-metrics.service"

export class GatewaySelectionService {
    async selectGateway(bookingAmount: number, bookingDate: string): Promise<{ gateway: PaymentProvider, metrics: any }> {
        const metrics = await paymentAllocationService.calculateDailyAllocation(bookingDate)
        const threshold = await gatewayMetricsService.getRoutingThreshold()

        // Rule 3: Edge case: First booking of day → Use Apps & Mobiles
        if (metrics.totalAmount === 0) {
            return { gateway: PaymentProvider.APPS_AND_MOBILES, metrics }
        }

        // Rule 1 & 4: If paystack_percentage ≤ threshold% → Use Apps & Mobiles
        if (metrics.paystackPercentage <= threshold) {
            return { gateway: PaymentProvider.APPS_AND_MOBILES, metrics }
        }

        // Rule 2: Else → Use Paystack
        return { gateway: PaymentProvider.PAYSTACK, metrics }
    }
}

export const gatewaySelectionService = new GatewaySelectionService()
