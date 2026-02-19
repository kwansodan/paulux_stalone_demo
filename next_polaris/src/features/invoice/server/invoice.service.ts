import { invoiceRepository, CreateInvoiceDTO } from "./invoice.repository"
import { auditLogService } from "@/features/payment/server/audit-log.service"
import { InvoiceStatus } from "@generated/prisma/client"
import { prisma } from "@/lib/prisma"

export class InvoiceService {
    async createInvoice(data: CreateInvoiceDTO) {
        const invoice = await invoiceRepository.create(data)

        await auditLogService.logAction({
            action: "INVOICE_CREATED",
            invoiceId: invoice.id,
            bookingId: invoice.bookingId,
            newValue: {
                status: invoice.status,
                amount: invoice.amount.toString(),
                currency: invoice.currency
            }
        })

        return invoice
    }

    async getInvoice(id: string) {
        return invoiceRepository.findById(id)
    }

    async getInvoicesByBooking(bookingId: string) {
        return invoiceRepository.findByBookingId(bookingId)
    }

    async getInvoiceByNumber(invoiceNumber: string) {
        return prisma.invoice.findUnique({
            where: { invoiceNumber },
            include: { booking: true }
        })
    }

    async updateInvoiceStatus(id: string, status: InvoiceStatus, updates: any = {}, metadata?: any) {
        const oldInvoice = await invoiceRepository.findById(id)
        if (!oldInvoice) throw new Error("Invoice not found")

        const updatedInvoice = await invoiceRepository.update(id, {
            status,
            ...updates
        })

        await auditLogService.logAction({
            action: "INVOICE_STATUS_UPDATED",
            invoiceId: id,
            bookingId: oldInvoice.bookingId,
            oldValue: { status: oldInvoice.status, gateway: oldInvoice.gateway },
            newValue: { status: updatedInvoice.status, gateway: updatedInvoice.gateway },
            metadata
        })

        return updatedInvoice
    }
}

export const invoiceService = new InvoiceService()
