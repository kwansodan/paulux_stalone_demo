import { prisma } from "@/lib/prisma";
import { InvoiceStatus, PaymentProvider } from "@generated/prisma/client";

export interface GatewayMetrics {
    paystack: {
        totalAmount: number;
        percentage: number;
        lastWebhookAt: Date | null;
    };
    appsAndMobiles: {
        totalAmount: number;
        percentage: number;
        lastWebhookAt: Date | null;
    };
    totalAmount: number;
    routingThreshold: number; // Percentage for Paystack
}

export class GatewayMetricsService {
    private readonly ROUTING_KEY = "PAYSTACK_ROUTING_THRESHOLD";
    private readonly DEFAULT_THRESHOLD = 40; // 40%

    async getMetrics(): Promise<GatewayMetrics> {
        // 1. Get total amounts from all PAID invoices
        const totals = await prisma.invoice.groupBy({
            by: ['gateway'],
            where: {
                status: InvoiceStatus.PAID,
                gateway: { in: [PaymentProvider.PAYSTACK, PaymentProvider.APPS_AND_MOBILES] }
            },
            _sum: {
                amount: true
            }
        });

        const paystackSum = Number(totals.find(t => t.gateway === PaymentProvider.PAYSTACK)?._sum.amount || 0);
        const amSum = Number(totals.find(t => t.gateway === PaymentProvider.APPS_AND_MOBILES)?._sum.amount || 0);
        const totalAmount = paystackSum + amSum;

        // 2. Get last webhook timestamps
        const lastPaystackWebhook = await prisma.paymentAuditLog.findFirst({
            where: {
                action: "WEBHOOK_RECEIVED",
                metadata: {
                    path: ['provider'],
                    equals: 'PAYSTACK'
                }
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        const lastAMWebhook = await prisma.paymentAuditLog.findFirst({
            where: {
                action: "WEBHOOK_RECEIVED",
                metadata: {
                    path: ['provider'],
                    equals: 'APPS_AND_MOBILES'
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
            paystack: {
                totalAmount: paystackSum,
                percentage: totalAmount > 0 ? (paystackSum / totalAmount) * 100 : 0,
                lastWebhookAt: lastPaystackWebhook?.createdAt || null
            },
            appsAndMobiles: {
                totalAmount: amSum,
                percentage: totalAmount > 0 ? (amSum / totalAmount) * 100 : 0,
                lastWebhookAt: lastAMWebhook?.createdAt || null
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
