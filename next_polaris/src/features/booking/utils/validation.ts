import { z } from "zod";

export const BookingStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "REFUNDED",
]);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const BookingInputSchema = z.object({
  bookingType: z.enum(["SCHEDULED", "WALKIN"]).default("SCHEDULED"),
  clientName: z
    .string()
    .min(2, "Client name must be at least 2 characters")
    .optional(),
  clientEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  clientPhone: z
    .string()
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone must be at most 20 characters"),
  serviceId: z
    .string()
    .uuid("Invalid service id")
    .optional(),
  serviceIds: z
    .array(z.string().uuid("Invalid service id"))
    .min(1, "At least one service is required")
    .optional(),
  bookingDate: z
    .string()
    .regex(dateRegex, "Date must be YYYY-MM-DD")
    .optional(),
  bookingTime: z
    .string()
    .regex(timeRegex, "Time must be HH:mm")
    .optional(),
  createdById: z.string().uuid().optional(),
  status: BookingStatusEnum.optional(),
  minDepositFixed: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Must be a positive amount"
    ),
  paymentStatus: PaymentStatusEnum.optional(),
  termsAccepted: z.boolean().optional(),
  packageId: z.string().uuid().optional(),
  packagePrice: z.number().min(0).optional(),
  promoCodeId: z.string().uuid().optional(),
  discountAmount: z.number().min(0).optional(),
  productIds: z
    .array(z.string().uuid("Invalid product id"))
    .optional(),
});

// Schema for full booking (with defaults)
export const BookingSchema = BookingInputSchema.extend({
  id: z.string().uuid().optional(),
  bookingReference: z.string().optional(),
  minDepositFixed: z.string().optional(),
  status: BookingStatusEnum.default("PENDING"),
  paymentStatus: PaymentStatusEnum.default("PENDING"),
  paymentRef: z.string().optional().nullable(),
});

export const CancelBookingSchema = z.object({
  reason: z.string().max(255).optional(),
})
export const BookingStatusSchema = z.object({
  status: BookingStatusEnum,
})


export type BookingStatusInput = z.infer<typeof BookingStatusSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
export type BookingInput = z.input<typeof BookingInputSchema>;
export type Booking = z.infer<typeof BookingSchema>;

