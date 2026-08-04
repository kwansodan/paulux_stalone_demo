import { z } from "zod";

/**
 * Shared by the request form and the API route, so the browser and the server
 * agree on what a valid lead looks like.
 */
export const DemoAccessSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name is too long"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(191),

  business: z.string().max(160, "Business name is too long").optional(),

  phone: z.string().max(40, "Phone number is too long").optional(),

  message: z.string().max(1000, "Message is too long").optional(),

  // Honeypot. Real people never see this field, so anything in it is a bot.
  // Named innocuously because scrapers skip fields called "honeypot".
  // Accepted by the schema and rejected in the route, so the bot check lives
  // in one obvious place rather than masquerading as a validation message.
  website: z.string().max(200).optional(),
});

export type DemoAccessInput = z.infer<typeof DemoAccessSchema>;
