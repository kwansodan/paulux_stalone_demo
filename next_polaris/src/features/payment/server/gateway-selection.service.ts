import { PaymentProvider } from "@generated/prisma/client"
import { paymentAllocationService } from "./payment-allocation.service"
import { gatewayMetricsService } from "./gateway-metrics.service"

export class GatewaySelectionService {
    async selectGateway(bookingAmount: number, bookingDate: string): Promise<{ gateway: PaymentProvider, metrics: any }> {
        const metrics = await paymentAllocationService.calculateDailyAllocation(bookingDate)
        const threshold = await gatewayMetricsService.getRoutingThreshold()

        // Rule 3: Edge case: First booking of day → Use Hubtel
        if (metrics.totalAmount === 0) {
            return { gateway: PaymentProvider.HUBTEL, metrics }
        }

        // Rule 1 & 4: If paystack_percentage ≤ threshold% → Use Hubtel
        if (metrics.paystackPercentage <= threshold) {
            return { gateway: PaymentProvider.HUBTEL, metrics }
        }

        // Rule 2: Else → Use Paystack
        return { gateway: PaymentProvider.PAYSTACK, metrics }
    }
}

export const gatewaySelectionService = new GatewaySelectionService()

