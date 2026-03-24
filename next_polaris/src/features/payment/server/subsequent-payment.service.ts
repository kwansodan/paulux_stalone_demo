import { prisma } from "@/lib/prisma"
import { invoiceService } from "@/features/invoice/server/invoice.service"
import { paymentProcessingService } from "./payment-processing.service"
import { auditLogService } from "./audit-log.service"
import { InvoiceStatus, PaymentProvider, SupportedCurrency, Prisma } from "@generated/prisma/client"
import { initiateRefund as initiatePaystackRefund } from "@/lib/paystack"

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
     * TOP-UP FLOW
     * Rule: must use SAME gateway as original payment
     */
    async processTopUp(data: TopUpDTO) {
        const { bookingId, amount } = data

        // Find original invoice
        const originalInvoice = await prisma.invoice.findFirst({
            where: { bookingId, transactionType: 'initial' },
            orderBy: { createdAt: 'asc' }
        })

        if (!originalInvoice || !originalInvoice.gateway) {
            throw new Error("Original invoice with gateway not found")
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) throw new Error("Booking not found")

        /**
         * Initialize payment using SAME gateway
         */
        return paymentProcessingService.initializePayment({
            bookingId,
            email: booking.clientEmail,
            amount,
            bookingReference: booking.bookingReference,
            forcedGateway: originalInvoice.gateway,
            parentInvoiceId: originalInvoice.id,
            transactionType: 'top_up'
        })
    }


    /**
     * REFUND FLOW
     */
    async processRefund(data: RefundDTO) {
        const { bookingId, amount, reason } = data

        // Find original PAID invoice
        const originalInvoice = await prisma.invoice.findFirst({
            where: {
                bookingId,
                transactionType: 'initial',
                status: InvoiceStatus.PAID
            },
            orderBy: { createdAt: 'asc' }
        })

        if (!originalInvoice) {
            throw new Error("Paid original invoice not found")
        }

        // Find payment record
        const payment = await prisma.payment.findFirst({
            where: { bookingId, status: 'PAID' }
        })

        if (!payment) throw new Error("Payment record not found")

        let refundResponse: unknown = null

        /**
         * PAYSTACK REFUND (Handles both Primary and Secondary)
         * Amount must be in pesewas
         */
        if (originalInvoice.gateway === PaymentProvider.PRIMARY_PAYSTACK || originalInvoice.gateway === PaymentProvider.SECONDARY_PAYSTACK) {
            refundResponse = await initiatePaystackRefund(
                payment.providerRef,
                amount ? Math.round(amount * 100) : undefined,
                reason || `Refund for booking ${bookingId}`,
                undefined,
                originalInvoice.gateway
            )
        } else {
            throw new Error(`Refund not supported for provider: ${originalInvoice.gateway}`)
        }

        /**
         * Create negative invoice (refund record)
         */
        const refundInvoice = await invoiceService.createInvoice({
            bookingId,
            invoiceNumber: `RFD-${Date.now()}`,
            amount: -(amount || Number(originalInvoice.amount)),
            currency: SupportedCurrency.GHS,
            parentInvoiceId: originalInvoice.id,
            transactionType: 'refund',
            gateway: originalInvoice.gateway ?? undefined
        })

        await invoiceService.updateInvoiceStatus(
            refundInvoice.id,
            InvoiceStatus.PAID,
            { gateway: originalInvoice.gateway ?? undefined }
        )

        /**
         * Audit logging
         */
        await auditLogService.logAction({
            action: "REFUND_PROCESSED",
            invoiceId: refundInvoice.id,
            bookingId,
            newValue: { amount: refundInvoice.amount },
            metadata: { refundResponse: refundResponse as Prisma.InputJsonValue, reason }
        })

        return {
            success: true,
            refundInvoiceNumber: refundInvoice.invoiceNumber,
            amount: refundInvoice.amount
        }
    }
}

export const subsequentPaymentService = new SubsequentPaymentService()