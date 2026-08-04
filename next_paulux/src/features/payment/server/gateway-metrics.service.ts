import { prisma } from "@/lib/prisma";
import { InvoiceStatus, PaymentProvider } from "@generated/prisma/client";

export interface GatewayMetrics {
    primary: {
        totalAmount: number;
        percentage: number;
        lastWebhookAt: Date | null;
    };
    secondary: {
        totalAmount: number;
        percentage: number;
        lastWebhookAt: Date | null;
    };
    totalAmount: number;
    routingThreshold: number; // Percentage for Primary
}

export class GatewayMetricsService {
    private readonly ROUTING_KEY = "PRIMARY_PAYSTACK_ROUTING_THRESHOLD";
    // Pre-configuration seed ONLY — used to route the very first payment before an
    // admin has ever set the split. The real proportion is admin-controlled from the
    // Payments → Gateway routing slider; no other file should hardcode a proportion.
    private readonly DEFAULT_THRESHOLD = 50;

    async getMetrics(): Promise<GatewayMetrics> {
        // Scope to the current calendar month so the admin view matches the window the
        // router balances over (see PaymentAllocationService.calculateMonthlyAllocation).
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 1. Get total amounts from this month's PAID invoices
        const totals = await prisma.invoice.groupBy({
            by: ['gateway'],
            where: {
                status: InvoiceStatus.PAID,
                gateway: { in: [PaymentProvider.PRIMARY_PAYSTACK, PaymentProvider.SECONDARY_PAYSTACK] },
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: {
                amount: true
            }
        });

        const primarySum = Number(totals.find(t => t.gateway === PaymentProvider.PRIMARY_PAYSTACK)?._sum.amount || 0);
        const secondarySum = Number(totals.find(t => t.gateway === PaymentProvider.SECONDARY_PAYSTACK)?._sum.amount || 0);
        const totalAmount = primarySum + secondarySum;

        // 2. Get last webhook timestamps
        const lastPrimaryWebhook = await prisma.paymentAuditLog.findFirst({
            where: {
                action: "WEBHOOK_RECEIVED",
                metadata: {
                    path: ['provider'],
                    equals: PaymentProvider.PRIMARY_PAYSTACK
                }
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        const lastSecondaryWebhook = await prisma.paymentAuditLog.findFirst({
            where: {
                action: "WEBHOOK_RECEIVED",
                metadata: {
                    path: ['provider'],
                    equals: PaymentProvider.SECONDARY_PAYSTACK
                }
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        // 3. Get current routing threshold
        const thresholdSetting = await prisma.systemSetting.findUnique({
            where: { key: this.ROUTING_KEY }
        });
        const routingThreshold = thresholdSetting ? parseInt(thresholdSetting.value) : this.DEFAULT_THRESHOLD;

        return {
            primary: {
                totalAmount: primarySum,
                percentage: totalAmount > 0 ? (primarySum / totalAmount) * 100 : 0,
                lastWebhookAt: lastPrimaryWebhook?.createdAt || null
            },
            secondary: {
                totalAmount: secondarySum,
                percentage: totalAmount > 0 ? (secondarySum / totalAmount) * 100 : 0,
                lastWebhookAt: lastSecondaryWebhook?.createdAt || null
            },
            totalAmount,
            routingThreshold
        };
    }

    async updateRoutingThreshold(percentage: number): Promise<void> {
        if (percentage < 0 || percentage > 100) {
            throw new Error("Percentage must be between 0 and 100");
        }

        await prisma.systemSetting.upsert({
            where: { key: this.ROUTING_KEY },
            update: { value: percentage.toString() },
            create: {
                key: this.ROUTING_KEY,
                value: percentage.toString()
            }
        });
    }

    async getRoutingThreshold(): Promise<number> {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: this.ROUTING_KEY }
        });
        return setting ? parseInt(setting.value) : this.DEFAULT_THRESHOLD;
    }
}

export const gatewayMetricsService = new GatewayMetricsService();

