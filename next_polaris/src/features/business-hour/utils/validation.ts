import { z } from "zod";

export const BusinessHourInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  isOpen: z.boolean().optional().default(true),
});


export const BusinessHourStatusSchema = z.object({
  isOpen: z.boolean(),
})

export type BusinessStatusInput = z.infer<typeof BusinessHourStatusSchema>;
export type BusinessHourInput = z.infer<typeof BusinessHourInputSchema>;
