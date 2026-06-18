import { z } from "zod"

// Gift cards are stored-value: the purchaser chooses an amount that the
// recipient can later spend on any service(s), in full or in part.
export const MIN_GIFT_CARD_AMOUNT = 10
export const MAX_GIFT_CARD_AMOUNT = 100000

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
    amount: z
      .number({ error: "Please enter a gift amount" })
      .positive("Gift amount must be greater than zero")
      .min(MIN_GIFT_CARD_AMOUNT, `Minimum gift card amount is GHS ${MIN_GIFT_CARD_AMOUNT}`)
      .max(MAX_GIFT_CARD_AMOUNT, `Maximum gift card amount is GHS ${MAX_GIFT_CARD_AMOUNT.toLocaleString()}`),
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
