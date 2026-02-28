import { PaymentProvider } from "@generated/prisma/client"
import { paymentAllocationService } from "./payment-allocation.service"
import { gatewayMetricsService } from "./gateway-metrics.service"

export class GatewaySelectionService {
    async selectGateway(bookingAmount: number, bookingDate: string): Promise<{ gateway: PaymentProvider, metrics: any }> {
        const metrics = await paymentAllocationService.calculateDailyAllocation(bookingDate)
        const threshold = await gatewayMetricsService.getRoutingThreshold()

        // Rule 3: Edge case: First booking of day → Use Secondary (previously Hubtel)
        if (metrics.totalAmount === 0) {
            return { gateway: PaymentProvider.SECONDARY_PAYSTACK, metrics }
        }

        // Rule 1 & 4: If primary_percentage ≤ threshold% → Use Secondary (previously Hubtel)
        // Note: The metrics names in paymentAllocationService will be updated too
        if (metrics.primaryPercentage <= threshold) {
            return { gateway: PaymentProvider.SECONDARY_PAYSTACK, metrics }
        }

        // Rule 2: Else → Use Primary (previously Paystack)
        return { gateway: PaymentProvider.PRIMARY_PAYSTACK, metrics }
    }
}

export const gatewaySelectionService = new GatewaySelectionService()

