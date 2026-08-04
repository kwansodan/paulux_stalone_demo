import { z } from "zod"

// Allowed units of measure for materials. Fixed list keeps the cost math and
// reporting consistent.
export const MATERIAL_UNITS = ["ml", "l", "g", "kg", "pcs", "bottle", "pack", "roll", "pair"] as const

const numberFromInput = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val))

export const MaterialInputSchema = z.object({
  name: z.string().min(1, "Material name is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  unit: z.enum(MATERIAL_UNITS),
  unitCost: numberFromInput.refine((v) => !isNaN(v) && v >= 0, "Unit cost must be valid"),
  lowStockThreshold: numberFromInput
    .refine((v) => !isNaN(v) && v >= 0, "Threshold must be zero or more")
    .optional()
    .default(0),
  trackStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  categoryId: z.string().uuid().nullable().optional(),
})

export const MaterialUpsertSchema = MaterialInputSchema.extend({
  id: z.string().uuid().optional(),
  currency: z.enum(["GHS"]).default("GHS"),
})

export const MaterialStatusSchema = z.object({
  isActive: z.boolean(),
})

export const MaterialMovementSchema = z
  .object({
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: numberFromInput.refine((v) => !isNaN(v) && v > 0, "Quantity must be greater than zero"),
    // Required only when issuing (OUT) to a section.
    sectionId: z.string().uuid().nullable().optional(),
    // Optional cost override, typically used on restock (IN) when the purchase
    // price changed. When provided it becomes the snapshot and updates the
    // material's current unit cost.
    unitCost: numberFromInput.refine((v) => !isNaN(v) && v >= 0).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => (data.type === "OUT" ? !!data.sectionId : true), {
    message: "Select the section the material is issued to",
    path: ["sectionId"],
  })

export const SectionInputSchema = z.object({
  name: z.string().min(1, "Section name is required").max(120),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional().default(0),
})

// Partial schema for PATCH — no defaults, so an update only touches the fields sent.
export const UpdateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(120).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export type MaterialFormInput = z.input<typeof MaterialInputSchema>
export type MaterialUpsertInput = z.infer<typeof MaterialUpsertSchema>
export type MaterialMovementInput = z.infer<typeof MaterialMovementSchema>
export type SectionInput = z.infer<typeof SectionInputSchema>
export type UpdateSectionInput = z.infer<typeof UpdateSectionSchema>
