import { invoiceService } from "@/features/invoice/server/invoice.service"
import { auditLogService } from "./audit-log.service"
import { gatewaySelectionService } from "./gateway-selection.service"
import { initializeTransaction as initializePaystack } from "@/lib/paystack"
import { initializeOnlineCheckout as initializeHubtel } from "@/lib/hubtel"
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

        // STEP 1 — Select gateway (automatic or forced)
        let gateway: PaymentProvider
        let metrics: any = null

        if (forcedGateway) {
            gateway = forcedGateway
        } else {
            const selection = await gatewaySelectionService.selectGateway(amount, new Date().toISOString())
            gateway = selection.gateway
            metrics = selection.metrics
        }

        // STEP 2 — Create invoice (always BEFORE calling payment provider)
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

        await invoiceService.updateInvoiceStatus(
            invoice.id,
            InvoiceStatus.PENDING,
            { gateway },
            { selectionMetrics: metrics }
        )

        // STEP 3 — Initialize payment with retry + failover
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

    /**
     * Handles retries and gateway failover
     */
    private async initializeWithResilience(gateway: PaymentProvider, details: any) {
        const retryDelays = [0, 2000, 5000]
        let lastError: any = null

        // RETRY LOOP
        for (let i = 0; i < retryDelays.length; i++) {
            if (retryDelays[i] > 0) {
                console.log(`Retrying initialization with ${gateway} in ${retryDelays[i]}ms (Attempt ${i + 1})...`)
                await new Promise(resolve => setTimeout(resolve, retryDelays[i]))
            }

            const result = await this.initializeGatewayTransaction(gateway, details)
            if (result.success) return result

            lastError = result.message
        }

        // FAILOVER LOGIC (only for first payments, not top-ups)
        if (!details.isSubsequent) {
            const alternateGateway =
                gateway === PaymentProvider.PAYSTACK
                    ? PaymentProvider.HUBTEL
                    : PaymentProvider.PAYSTACK

            console.warn(`All retry attempts failed for ${gateway}. Attempting failover to ${alternateGateway}...`)

            await auditLogService.logAction({
                action: "GATEWAY_FAILOVER",
                invoiceId: details.invoiceId,
                bookingId: details.bookingId,
                newValue: { from: gateway, to: alternateGateway },
                metadata: { error: lastError }
            })

            // Update invoice to new gateway
            await invoiceService.updateInvoiceStatus(details.invoiceId, InvoiceStatus.PENDING, { gateway: alternateGateway })

            // Single attempt on failover gateway
            return this.initializeGatewayTransaction(alternateGateway, details)
        }

        return {
            success: false,
            message: `Failed all attempts with ${gateway}: ${lastError}`
        }
    }

    /**
     * Initializes payment with the selected gateway
     */
    private async initializeGatewayTransaction(
        gateway: PaymentProvider,
        details: {
            invoiceId: string,
            bookingId: string,
            email: string,
            amount: number,
            bookingReference: string,
            callbackUrl?: string,
            invoiceNumber: string
        }
    ) {
        const { invoiceId, bookingId, email, amount, bookingReference, callbackUrl, invoiceNumber } = details

        try {
            let paymentUrl = ""
            let providerResponse: any = null

            // Convert GHS → pesewas once
            const amountPesewas = Math.round(amount * 100)

            /**
             * PAYSTACK FLOW
             */
            if (gateway === PaymentProvider.PAYSTACK) {
                providerResponse = await initializePaystack(
                    email,
                    amountPesewas,
                    invoiceNumber, // Pass invoiceNumber instead of bookingReference
                    callbackUrl,
                    'GHS'
                )

                paymentUrl = providerResponse.data.authorization_url
            }

            /**
             * HUBTEL FLOW (replaces Apps & Mobiles)
             *
             * Hubtel requires:
             * - amount in pesewas
             * - clientReference (your booking reference)
             * - callback URL for webhook
             *
             * Returns a paylink for redirect.
             */
            else if (gateway === PaymentProvider.HUBTEL) {
                providerResponse = await initializeHubtel({
                    amountPesewas,
                    clientReference: invoiceNumber, // Pass invoiceNumber instead of bookingReference
                    callbackUrl: callbackUrl!,
                    description: `Invoice ${invoiceNumber} payment`
                })

                if (!providerResponse.success) {
                    throw new Error(providerResponse.message || "Hubtel initialization failed")
                }

                paymentUrl = providerResponse.paylinkUrl!
            }

            // AUDIT LOG — successful initialization
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