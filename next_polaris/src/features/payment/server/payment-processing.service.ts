import { invoiceService } from "@/features/invoice/server/invoice.service"
import { auditLogService } from "./audit-log.service"
import { gatewaySelectionService } from "./gateway-selection.service"
import { initializeTransaction as initializePaystack } from "@/lib/paystack"
import { initializeAppsAndMobilesTransaction as initializeAM } from "@/lib/apps-and-mobiles"
import { InvoiceStatus, PaymentProvider, SupportedCurrency } from "@generated/prisma/client"

export interface InitializePaymentDTO {
    bookingId: string
    email: string
    amount: number
    bookingReference: string
    callbackUrl?: string
    parentInvoiceId?: string
    transactionType?: string
}

export class PaymentProcessingService {
    async initializePayment(data: InitializePaymentDTO & { forcedGateway?: PaymentProvider }) {
        const { bookingId, email, amount, bookingReference, callbackUrl, forcedGateway, parentInvoiceId, transactionType } = data

        // 1. Select initial gateway
        let gateway: PaymentProvider
        let metrics: any = null

        if (forcedGateway) {
            gateway = forcedGateway
        } else {
            const selection = await gatewaySelectionService.selectGateway(amount, new Date().toISOString())
            gateway = selection.gateway
            metrics = selection.metrics
        }

        // 2. Create Invoice record (status: 'PENDING')
        const invoiceNumber = `INV-${Date.now()}`
        const invoice = await invoiceService.createInvoice({
            bookingId,
            invoiceNumber,
            amount,
            currency: SupportedCurrency.GHS,
            gateway,
            parentInvoiceId,
            transactionType
        })

        await invoiceService.updateInvoiceStatus(invoice.id, InvoiceStatus.PENDING,
            { gateway },
            { selectionMetrics: metrics }
        )

        // 3. Try to initialize with retries and failover
        return this.initializeWithResilience(gateway, {
            invoiceId: invoice.id,
            bookingId,
            email,
            amount,
            bookingReference,
            callbackUrl,
            invoiceNumber: invoice.invoiceNumber,
            isSubsequent: !!parentInvoiceId
        })
    }

    private async initializeWithResilience(gateway: PaymentProvider, details: any) {
        // Attempt 1, 2 (2s delay), 3 (5s delay)
        const retryDelays = [0, 2000, 5000]
        let lastError: any = null

        // --- RETRY LOOP ---
        for (let i = 0; i < retryDelays.length; i++) {
            if (retryDelays[i] > 0) {
                console.log(`Retrying initialization with ${gateway} in ${retryDelays[i]}ms (Attempt ${i + 1})...`)
                await new Promise(resolve => setTimeout(resolve, retryDelays[i]))
            }

            const result = await this.initializeGatewayTransaction(gateway, details)
            if (result.success) return result

            lastError = result.message
        }

        // --- FAILOVER LOGIC ---
        // Only failover if it's not a subsequent payment (top-up) and we have an alternate gateway
        if (!details.isSubsequent) {
            const alternateGateway = gateway === PaymentProvider.PAYSTACK
                ? PaymentProvider.APPS_AND_MOBILES
                : PaymentProvider.PAYSTACK

            console.warn(`All retry attempts failed for ${gateway}. Attempting failover to ${alternateGateway}...`)

            await auditLogService.logAction({
                action: "GATEWAY_FAILOVER",
                invoiceId: details.invoiceId,
                bookingId: details.bookingId,
                newValue: { from: gateway, to: alternateGateway },
                metadata: { error: lastError }
            })

            // Update invoice with new gateway
            await invoiceService.updateInvoiceStatus(details.invoiceId, InvoiceStatus.PENDING, { gateway: alternateGateway })

            // Try initialization with alternate gateway (one attempt only for simplicity)
            return this.initializeGatewayTransaction(alternateGateway, details)
        }

        return {
            success: false,
            message: `Failed all attempts with ${gateway}: ${lastError}`
        }
    }

    private async initializeGatewayTransaction(gateway: PaymentProvider, details: {
        invoiceId: string,
        bookingId: string,
        email: string,
        amount: number,
        bookingReference: string,
        callbackUrl?: string,
        invoiceNumber: string
    }) {
        const { invoiceId, bookingId, email, amount, bookingReference, callbackUrl, invoiceNumber } = details

        try {
            let paymentUrl = ""
            let providerResponse: any = null

            if (gateway === PaymentProvider.PAYSTACK) {
                const amountPesewas = Math.round(amount * 100)
                providerResponse = await initializePaystack(
                    email,
                    amountPesewas,
                    bookingReference,
                    callbackUrl,
                    'GHS'
                )
                paymentUrl = providerResponse.data.authorization_url
            } else {
                const amountPesewas = Math.round(amount * 100)
                providerResponse = await initializeAM(
                    email,
                    amountPesewas,
                    bookingReference,
                    callbackUrl
                )
                paymentUrl = providerResponse.data.payment_url
            }

            // Log success
            await auditLogService.logAction({
                action: "PAYMENT_INITIALIZED",
                invoiceId,
                bookingId,
                newValue: { gateway, paymentUrl },
                metadata: { providerResponse }
            })

            return {
                success: true,
                paymentUrl,
                gateway,
                invoiceNumber
            }

        } catch (error: any) {
            // Log partial failure for retries
            console.error(`Attempt failed for ${gateway}:`, error.message)

            await auditLogService.logAction({
                action: "PAYMENT_INITIALIZATION_ATTEMPT_FAILED",
                invoiceId,
                bookingId,
                metadata: { gateway, error: error.message }
            })

            return {
                success: false,
                message: error.message
            }
        }
    }
}

export const paymentProcessingService = new PaymentProcessingService()
