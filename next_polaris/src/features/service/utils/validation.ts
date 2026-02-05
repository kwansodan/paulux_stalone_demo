import { z } from 'zod';

// export const ServiceUpsertSchema = z.object({
//   id: z.string().uuid().optional(),
//   name: z.string().min(1, 'Service name is required').max(255, 'Name must be less than 255 characters'),
//   description: z.string().max(1000, 'Description must be less than 1000 characters').nullable().optional(),
//   durationMinutes: z.number().int('Duration must be a whole number').positive('Duration must be greater than 0'),
//   price: z.string().or(z.number())
//     .refine((val) => {
//       const num = typeof val === 'string' ? parseFloat(val) : val;
//       return !isNaN(num) && num >= 0;
//     }, 'Price must be a valid positive number')
//     .transform((val) => typeof val === 'string' ? parseFloat(val) : val),
//   currency: z.enum(['GHS']).default('GHS'),
//   isActive: z.boolean().default(true),
// });

export const ServiceInputSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000).nullable().optional(),
  // durationMinutes: z.number().int('Duration must be a whole number').positive('Duration must be greater than 0'),
  durationMinutes: z
  .union([z.string(), z.number()])
  .transform((val) => Number(val))
  .refine(
    (val) => Number.isInteger(val) && val > 0,
    "Duration must be a positive whole number"
  ),


  price: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Price must be valid"),

  minDepositPercent: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 100, "Must be 0–100"),


  maxBookingsPerDay: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  latestBookingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:mm")
    .optional()
    .nullable(),
  isActive: z.boolean(),
})

export const ServiceUpsertSchema = ServiceInputSchema.extend({
  id: z.string().uuid().optional(),
  currency: z.enum(["GHS"]).default("GHS"),
})

export const ServiceStatusSchema = z.object({
  isActive: z.boolean(),
})


export type ServiceStatusInput = z.infer<typeof ServiceStatusSchema>;

// input shape (what the form sends)
export type ServiceFormInput = z.input<typeof ServiceInputSchema>

// parsed shape (what backend receives)
export type ServiceInput = z.infer<typeof ServiceInputSchema>

export type ServiceUpsertInput = z.infer<typeof ServiceUpsertSchema>;