import { Material, MaterialCategory, Section } from "@generated/prisma/client"

export type MaterialMovementTypeValue = "IN" | "OUT" | "ADJUSTMENT"

export type SerializedMaterial = Omit<
  Material,
  "unitCost" | "stockQuantity" | "lowStockThreshold" | "createdAt" | "updatedAt"
> & {
  unitCost: string
  stockQuantity: string
  lowStockThreshold: string
  createdAt: string
  updatedAt: string
  category?: Pick<MaterialCategory, "id" | "name"> | null
}

export type SerializedSection = Omit<Section, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export type SerializedMaterialCategory = Omit<MaterialCategory, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
  _count?: { materials: number }
}

export type MaterialMovementRow = {
  id: string
  materialId: string
  type: MaterialMovementTypeValue
  quantity: string
  sectionId: string | null
  section: { id: string; name: string } | null
  unitCostAtMovement: string
  notes: string | null
  createdAt: string
  createdBy: { username: string } | null
}

/** A single material line consumed by a section within the report window. */
export type SectionUsageLine = {
  materialId: string
  materialName: string
  unit: string
  quantity: number
  cost: number
}

/** Aggregated material usage + cost for one section over the report window. */
export type SectionUsageGroup = {
  sectionId: string | null
  sectionName: string
  totalCost: number
  lines: SectionUsageLine[]
}

export type SectionUsageReport = {
  from: string
  to: string
  grandTotal: number
  sections: SectionUsageGroup[]
}
