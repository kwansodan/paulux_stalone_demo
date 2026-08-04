import { prisma } from "@/lib/prisma"
import { InvoiceStatus, PaymentProvider } from "@generated/prisma/client"

export interface AllocationMetrics {
    primaryTotal: number
    secondaryTotal: number
    primaryPercentage: number
    secondaryPercentage: number
    totalAmount: number
}

export class PaymentAllocationService {
    async calculateMonthlyAllocation(date: string): Promise<AllocationMetrics> {
        // Routing is decided at initialization, so the allocation must count invoices
        // we have already ROUTED (PENDING/ISSUED/PAID), not only settled ones — counting
        // PAID-only lagged behind and let bursts of unpaid checkouts over-route one gateway.
        // Window is the calendar month containing `date` (monthly reset).
        const targetDate = new Date(date)
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0, 0)
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999)

        const invoices = await prisma.invoice.findMany({
            where: {
                status: { in: [InvoiceStatus.PENDING, InvoiceStatus.ISSUED, InvoiceStatus.PAID] },
                transactionType: "initial",
                gateway: { in: [PaymentProvider.PRIMARY_PAYSTACK, PaymentProvider.SECONDARY_PAYSTACK] },
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        })

        let primaryTotal = 0
        let secondaryTotal = 0

        invoices.forEach((invoice) => {
            const amount = Number(invoice.amount)
            if (invoice.gateway === PaymentProvider.PRIMARY_PAYSTACK) {
                primaryTotal += amount
            } else if (invoice.gateway === PaymentProvider.SECONDARY_PAYSTACK) {
                secondaryTotal += amount
            }
        })

        const totalAmount = primaryTotal + secondaryTotal
        const primaryPercentage = totalAmount > 0 ? (primaryTotal / totalAmount) * 100 : 0
        const secondaryPercentage = totalAmount > 0 ? (secondaryTotal / totalAmount) * 100 : 0

        return {
            primaryTotal,
            secondaryTotal,
            primaryPercentage,
            secondaryPercentage,
            totalAmount,
        }
    }
}

export const paymentAllocationService = new PaymentAllocationService()

