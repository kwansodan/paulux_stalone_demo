import { PaymentProvider } from "@generated/prisma/client"
import { paymentAllocationService } from "./payment-allocation.service"
import { gatewayMetricsService } from "./gateway-metrics.service"

export class GatewaySelectionService {
    async selectGateway(bookingAmount: number, bookingDate: string): Promise<{ gateway: PaymentProvider, metrics: unknown }> {
        const metrics = await paymentAllocationService.calculateDailyAllocation(bookingDate)
        const threshold = await gatewayMetricsService.getRoutingThreshold()

        // Rule 3: Edge case: First booking of day → Use Secondary (previously Hubtel)
        if (metrics.totalAmount === 0) {
            return { gateway: PaymentProvider.SECONDARY_PAYSTACK, metrics }
        }

        // Calculate distance to threshold
        const primaryThreshold = threshold
        const secondaryThreshold = 100 - threshold

        // If primary percentage is below its threshold, route to primary
        if (metrics.primaryPercentage < primaryThreshold) {
            return { gateway: PaymentProvider.PRIMARY_PAYSTACK, metrics }
        }

        // If secondary percentage is below its threshold, route to secondary
        if (metrics.secondaryPercentage < secondaryThreshold) {
            return { gateway: PaymentProvider.SECONDARY_PAYSTACK, metrics }
        }

        // Default to Primary
        return { gateway: PaymentProvider.PRIMARY_PAYSTACK, metrics }
    }
}

export const gatewaySelectionService = new GatewaySelectionService()

