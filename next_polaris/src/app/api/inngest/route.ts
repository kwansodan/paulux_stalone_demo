import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { passwordResetEvent } from "@/features/auth/events/event-password-reset";
import { bookingCancelledEvent } from "@/features/auth/events/event-booking-cancel";
import { bookingCreatedEvent } from "@/features/booking/events/event-booking-created";
import { bookingUpdatedEvent } from "@/features/booking/events/event-booking-updated";
import { paymentReceivedEvent } from "@/features/payment/events/event-payment-received";
import { stylistAssignedEvent } from "@/features/booking/events/event-stylist-assigned";
import { productLowStockEvent } from "@/features/product/events/event-product-low-stock";
import { materialLowStockEvent } from "@/features/material/events/event-material-low-stock";
// import { NextRequest, NextResponse } from "next/server";

// console.log("EVENT KEY:", process.env.INNGEST_EVENT_KEY);
// console.log("BASE URL:", process.env.INNGEST_BASE_URL);
// console.log("SIGNING KEY URL:", process.env.INNGEST_SIGNING_KEY);

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    passwordResetEvent,
    bookingCancelledEvent,
    bookingCreatedEvent,
    bookingUpdatedEvent,
    paymentReceivedEvent,
    stylistAssignedEvent,
    productLowStockEvent,
    materialLowStockEvent,
  ],
  // signingKey: process.env.INNGEST_SIGNING_KEY
});

// const handler = serve({
//   client: inngest,
//   functions: [passwordResetEvent],
//   signingKey: process.env.INNGEST_SIGNING_KEY,
// });

// export async function GET(req: NextRequest, res: NextResponse) {
//   console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY);
//   return handler.GET(req, res);
// }

// export async function POST(req: NextRequest, res: NextResponse) {
//   console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY);
//   return handler.POST(req, res);
// }

// export async function PUT(req: NextRequest, res: NextResponse) {
//   console.log("SIGNING KEY:", process.env.INNGEST_SIGNING_KEY);
//   return handler.PUT(req, res);
// }
