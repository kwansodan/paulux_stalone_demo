import { z } from 'zod'

export const ProductInputSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000).nullable().optional(),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Price must be valid"),
  isActive: z.boolean(),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
})

export const ProductUpsertSchema = ProductInputSchema.extend({
  id: z.string().uuid().optional(),
  currency: z.enum(["GHS"]).default("GHS"),
})

export const ProductStatusSchema = z.object({
  isActive: z.boolean(),
})

export type ProductStatusInput = z.infer<typeof ProductStatusSchema>
export type ProductFormInput = z.input<typeof ProductInputSchema>
export type ProductInput = z.infer<typeof ProductInputSchema>
export type ProductUpsertInput = z.infer<typeof ProductUpsertSchema>
