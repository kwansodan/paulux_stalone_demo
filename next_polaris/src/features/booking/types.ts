import { Prisma } from "@generated/prisma/client";

export interface BookingQueryResult {
  bookings: BookingWithService[];
  count?: number;
  revenue?: number;
}

export interface BookingQueryOptions {
  includeCount?: boolean;
  includeRevenue?: boolean;
}

export type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
  }
}>