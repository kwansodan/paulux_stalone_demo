import { prisma } from "@/lib/prisma"

export interface AuditLogDTO {
    action: string
    invoiceId?: string
    bookingId?: string
    oldValue?: any
    newValue?: any
    metadata?: any
}

export class AuditLogService {
    async logAction(data: AuditLogDTO) {
        return prisma.paymentAuditLog.create({
            data: {
                action: data.action,
                invoiceId: data.invoiceId,
                bookingId: data.bookingId,
                oldValue: data.oldValue,
                newValue: data.newValue,
                metadata: data.metadata,
            }
        })
    }
}

export const auditLogService = new AuditLogService()
