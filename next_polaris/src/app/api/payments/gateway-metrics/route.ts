import { NextRequest, NextResponse } from 'next/server';
import { gatewayMetricsService } from '@/features/payment/server/gateway-metrics.service';

export async function GET() {
    try {
        const metrics = await gatewayMetricsService.getMetrics();
        return NextResponse.json({
            success: true,
            message: "Successfully retrieved gateway payment metrics",
            data: metrics
        });
    } catch (error: any) {
        console.error('Error fetching gateway metrics:', error);
        return NextResponse.json(
            { message: 'Error fetching gateway metrics', error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { paystackPercentage } = body;

        if (typeof paystackPercentage !== 'number') {
            return NextResponse.json(
                { message: 'paystackPercentage must be a number' },
                { status: 400 }
            );
        }

        await gatewayMetricsService.updateRoutingThreshold(paystackPercentage);

        return NextResponse.json({
            message: `Routing threshold updated to ${paystackPercentage}%`,
            success: true
        });
    } catch (error: any) {
        console.error('Error updating routing threshold:', error);
        return NextResponse.json(
            { message: 'Error updating routing threshold', error: error.message },
            { status: 500 }
        );
    }
}
