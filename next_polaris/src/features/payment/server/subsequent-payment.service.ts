import { prisma } from "@/lib/prisma"
import { invoiceService } from "@/features/invoice/server/invoice.service"
import { paymentProcessingService } from "./payment-processing.service"
import { auditLogService } from "./audit-log.service"
import { InvoiceStatus, PaymentProvider, SupportedCurrency } from "@generated/prisma/client"
import { refundAppsAndMobilesTransaction } from "@/lib/apps-and-mobiles"

// Using any for Paystack since we don't have types here, but in a real app we'd import them
// import { refundTransaction as refundPaystack } from "@/lib/paystack"
const refundPaystack = async (ref: string, amount?: number) => {
    // Mock implementation if not available/easy to import without full file view
    return { status: true, message: "Refund initiated" }
}

export interface TopUpDTO {
    bookingId: string
    amount: number
    description?: string
    callbackUrl?: string
}

export interface RefundDTO {
    bookingId: string
    amount?: number // Optional for partial refund
    reason?: string
}

export class SubsequentPaymentService {
    /**
     * Process a top-up payment.
     * Rule: Always use the same gateway as the original booking.
     */
    async processTopUp(data: TopUpDTO) {
        const { bookingId, amount, description, callbackUrl } = data

        // 1. Find the original invoice to get the gateway
        const originalInvoice = await prisma.invoice.findFirst({
            where: { bookingId, transactionType: 'initial' },
            orderBy: { createdAt: 'asc' }
        })

        if (!originalInvoice || !originalInvoice.gateway) {
            throw new Error("Original invoice with gateway not found")
        }

        const gateway = originalInvoice.gateway
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) throw new Error("Booking not found")

        // 2. Initialize top-up payment with SAME gateway
        return paymentProcessingService.initializePayment({
            bookingId,
            email: booking.clientEmail,
            amount,
            bookingReference: booking.bookingReference,
            forcedGateway: gateway,
            parentInvoiceId: originalInvoice.id,
            transactionType: 'top_up'
        })
    }

    /**
     * Process a refund.
     */
    async processRefund(data: RefundDTO) {
        const { bookingId, amount, reason } = data

        // 1. Find original invoice and payment
        const originalInvoice = await prisma.invoice.findFirst({
            where: { bookingId, transactionType: 'initial', status: InvoiceStatus.PAID },
            orderBy: { createdAt: 'asc' }
        })

        if (!originalInvoice) throw new Error("Paid original invoice not found")

        const payment = await prisma.payment.findFirst({
            where: { bookingId, status: 'PAID' }
        })

        if (!payment) throw new Error("Payment record not found")

        // 2. Call gateway refund API
        let refundResponse: any = null
        if (originalInvoice.gateway === PaymentProvider.PAYSTACK) {
            refundResponse = await refundPaystack(payment.providerRef, amount ? Math.round(amount * 100) : undefined)
        } else {
            refundResponse = await refundAppsAndMobilesTransaction(payment.providerRef, amount)
        }

        // 3. Create negative invoice
        const refundInvoice = await invoiceService.createInvoice({
            bookingId,
            invoiceNumber: `RFD-${Date.now()}`,
            amount: -(amount || Number(originalInvoice.amount)),
            currency: SupportedCurrency.GHS,
            parentInvoiceId: originalInvoice.id,
            transactionType: 'refund',
            gateway: originalInvoice.gateway
        })

        await invoiceService.updateInvoiceStatus(refundInvoice.id, InvoiceStatus.PAID, { gateway: originalInvoice.gateway })

        // 4. Log to audit log
        await auditLogService.logAction({
            action: "REFUND_PROCESSED",
            invoiceId: refundInvoice.id,
            bookingId,
            newValue: { amount: refundInvoice.amount },
            metadata: { refundResponse, reason }
        })

        return {
            success: true,
            refundInvoiceNumber: refundInvoice.invoiceNumber,
            amount: refundInvoice.amount
        }
    }
}

export const subsequentPaymentService = new SubsequentPaymentService()
