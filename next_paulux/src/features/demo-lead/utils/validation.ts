import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

/**
 * Step 1 — request a code. Shared by the form and the API route so the browser
 * and the server agree on what a valid request looks like.
 *
 * Phone is required and email is not: a verified mobile number is what
 * qualifies a lead here.
 */
export const DemoAccessSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name is too long"),

  phone: z
    .string()
    .min(1, "Mobile number is required")
    .refine(isValidPhone, "Enter a valid Ghanaian mobile number"),

  email: z
    .union([z.string().email("Invalid email address").max(191), z.literal("")])
    .optional(),

  business: z.string().max(160, "Business name is too long").optional(),

  message: z.string().max(1000, "Message is too long").optional(),

  // Honeypot. Real people never see this field, so anything in it is a bot.
  // Named innocuously because scrapers skip fields called "honeypot".
  // Accepted by the schema and rejected in the route, so the bot check lives
  // in one obvious place rather than masquerading as a validation message.
  website: z.string().max(200).optional(),
});

/**
 * Step 2, as the form sees it — just the code.
 *
 * The lead id deliberately isn't part of the form: it comes back from step 1
 * and lives in component state. Keeping it out means the form cannot fail
 * validation on a field the user can't see or fix.
 */
export const DemoCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Step 2, as the API sees it. */
export const DemoVerifySchema = z.object({
  leadId: z.string().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type DemoAccessInput = z.infer<typeof DemoAccessSchema>;
export type DemoCodeInput = z.infer<typeof DemoCodeSchema>;
export type DemoVerifyInput = z.infer<typeof DemoVerifySchema>;
