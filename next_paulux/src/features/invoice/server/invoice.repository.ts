import { prisma } from "@/lib/prisma"
import { InvoiceStatus, SupportedCurrency, PaymentProvider } from "@generated/prisma/client"

export interface CreateInvoiceDTO {
    bookingId: string
    invoiceNumber: string
    amount: number
    feeAmount?: number
    currency: SupportedCurrency
    dueDate?: Date
    parentInvoiceId?: string
    transactionType?: string
    gateway?: PaymentProvider
}

export class InvoiceRepository {
    async create(data: CreateInvoiceDTO) {
        return prisma.invoice.create({
            data: {
                bookingId: data.bookingId,
                invoiceNumber: data.invoiceNumber,
                amount: data.amount,
                feeAmount: data.feeAmount ?? 0,
                currency: data.currency,
                dueDate: data.dueDate,
                status: InvoiceStatus.DRAFT,
                parentInvoiceId: data.parentInvoiceId,
                transactionType: data.transactionType || 'initial',
                gateway: data.gateway,
            },
            include: {
                booking: true
            }
        })
    }

    async findById(id: string) {
        return prisma.invoice.findUnique({
            where: { id },
            include: {
                booking: true,
                auditLogs: {
                    orderBy: { createdAt: "desc" }
                }
            }
        })
    }

    async findByBookingId(bookingId: string) {
        return prisma.invoice.findMany({
            where: { bookingId },
            orderBy: { createdAt: "desc" }
        })
    }

    async update(id: string, data: Partial<{ status: InvoiceStatus, paidAt: Date, gateway: PaymentProvider, transactionType: string }>) {
        return prisma.invoice.update({
            where: { id },
            data
        })
    }

    async updateStatus(id: string, status: InvoiceStatus, paidAt?: Date) {
        return this.update(id, {
            status,
            paidAt: paidAt ?? (status === InvoiceStatus.PAID ? new Date() : undefined)
        })
    }
}

export const invoiceRepository = new InvoiceRepository()