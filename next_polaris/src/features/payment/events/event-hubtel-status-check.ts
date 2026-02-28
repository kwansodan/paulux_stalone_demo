import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/hubtel";
import { paymentService } from "../server/payment.service";
import { auditLogService } from "../server/audit-log.service";
import { InvoiceStatus } from "@generated/prisma/client";

export const hubtelStatusCheckEvent = inngest.createFunction(
    { id: "hubtel-transaction-status-check" },
    { event: "app/payment.hubtel-check-status" },
    async ({ event, step }) => {
        const { invoiceNumber, invoiceId } = event.data;

        // Wait for 5 minutes before checking
        await step.sleep("wait-for-hubtel-callback", "5m");

        // Fetch the current invoice status
        const invoice = await step.run("get-invoice-status", async () => {
            return await prisma.invoice.findUnique({
                where: { id: invoiceId },
            });
        });

        if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID) {
            return { message: "Invoice already processed or not found", status: invoice?.status };
        }

        // Call Hubtel Status Check API
        const statusResult = await step.run("check-hubtel-api", async () => {
            return await getTransactionStatus(invoiceNumber);
        });

        if (statusResult.success && statusResult.status === "Paid") {
            // Confirm the payment
            await step.run("confirm-payment", async () => {
                await paymentService.confirmInvoicePayment(
                    invoiceId,
                    statusResult.transactionId || invoiceNumber,
                    statusResult.raw,
                    statusResult.amount ? Number(statusResult.amount) : undefined
                );
            });

            await step.run("log-audit-success", async () => {
                await auditLogService.logAction({
                    action: "STATUS_CHECK_SUCCESS",
                    invoiceId: invoiceId,
                    bookingId: invoice.bookingId,
                    newValue: { status: InvoiceStatus.PAID },
                    metadata: { source: "status-check-api", hubtelResponse: statusResult.raw },
                });
            });

            return { message: "Payment confirmed via status check", status: "Paid" };
        } else {
            await step.run("log-audit-pending", async () => {
                await auditLogService.logAction({
                    action: "STATUS_CHECK_COMPLETED",
                    invoiceId: invoiceId,
                    bookingId: invoice.bookingId,
                    metadata: { source: "status-check-api", hubtelStatus: statusResult.status },
                });
            });

            return { message: "Payment still pending or failed", status: statusResult.status };
        }
    }
);
