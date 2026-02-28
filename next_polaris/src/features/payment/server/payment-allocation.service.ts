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
    async calculateDailyAllocation(date: string): Promise<AllocationMetrics> {
        // Standardize date search - assuming date is in "YYYY-MM-DD" format or similar
        // We need to find all invoices issued/paid on this specific date.
        // However, the task says "today's completed invoices".
        // I'll query invoices where status is PAID and createdAt is within the day.

        const targetDate = new Date(date)
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

        const invoices = await prisma.invoice.findMany({
            where: {
                status: InvoiceStatus.PAID,
                transactionType: "initial",
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
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

