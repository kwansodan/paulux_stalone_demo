import { z } from "zod"

export const GiftCardItemInputSchema = z.object({
  itemType: z.enum(["SERVICE", "PRODUCT"]),
  id: z.string().uuid("Invalid item id"),
  quantity: z.number().int().min(1).default(1),
})

export const CreateGiftCardSchema = z
  .object({
    senderName: z.string().min(2, "Your name must be at least 2 characters"),
    senderEmail: z.string().email("Invalid email address"),
    senderPhone: z.string().min(7, "Invalid phone number").max(20),
    recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
    recipientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    recipientPhone: z.string().min(7, "Invalid phone number").max(20).optional().or(z.literal("")),
    message: z.string().max(500, "Message is too long").optional().or(z.literal("")),
    deliveryMethod: z.enum(["SMS", "EMAIL", "BOTH"]),
    items: z.array(GiftCardItemInputSchema).min(1, "Add at least one service or product to your gift"),
    callbackUrl: z.string().optional(),
  })
  .refine(
    (data) => (data.deliveryMethod === "EMAIL" || data.deliveryMethod === "BOTH" ? !!data.recipientEmail : true),
    { message: "Recipient email is required for email delivery", path: ["recipientEmail"] }
  )
  .refine(
    (data) => (data.deliveryMethod === "SMS" || data.deliveryMethod === "BOTH" ? !!data.recipientPhone : true),
    { message: "Recipient phone is required for SMS delivery", path: ["recipientPhone"] }
  )

export type CreateGiftCardInput = z.infer<typeof CreateGiftCardSchema>

export const ValidateGiftCardSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
})

export const RedeemGiftCardSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
})
