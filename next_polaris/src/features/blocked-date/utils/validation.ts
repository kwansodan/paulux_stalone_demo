import { z } from "zod";

export const BlockedDateInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional().nullable(),
});

export type BlockedDateInput = z.infer<typeof BlockedDateInputSchema>;

export const BlockedDateWithTimeRangeInputSchema = BlockedDateInputSchema.extend({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export type BlockedDateWithTimeRangeInput = z.infer<typeof BlockedDateWithTimeRangeInputSchema>;
