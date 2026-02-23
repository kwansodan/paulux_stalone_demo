import { prisma } from "@/lib/prisma"
import { InvoiceStatus, PaymentProvider } from "@generated/prisma/client"

export interface AllocationMetrics {
    paystackTotal: number
    hubtelTotal: number
    paystackPercentage: number
    hubtelPercentage: number
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

        let paystackTotal = 0
        let hubtelTotal = 0

        invoices.forEach((invoice) => {
            const amount = Number(invoice.amount)
            if (invoice.gateway === PaymentProvider.PAYSTACK) {
                paystackTotal += amount
            } else if (invoice.gateway === PaymentProvider.HUBTEL) {
                hubtelTotal += amount
            }
        })

        const totalAmount = paystackTotal + hubtelTotal
        const paystackPercentage = totalAmount > 0 ? (paystackTotal / totalAmount) * 100 : 0
        const hubtelPercentage = totalAmount > 0 ? (hubtelTotal / totalAmount) * 100 : 0

        return {
            paystackTotal,
            hubtelTotal,
            paystackPercentage,
            hubtelPercentage,
            totalAmount,
        }
    }
}

export const paymentAllocationService = new PaymentAllocationService()

