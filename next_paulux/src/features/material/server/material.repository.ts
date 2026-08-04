import { prisma } from "@/lib/prisma"
import { Prisma } from "@generated/prisma/client"
import { MaterialUpsertInput, MaterialMovementInput } from "../utils/validation"
import {
  SerializedMaterial,
  MaterialMovementRow,
  SectionUsageReport,
  SectionUsageGroup,
} from "../types"

function serializeMaterial(material: any): SerializedMaterial {
  return {
    ...material,
    unitCost: material.unitCost.toString(),
    stockQuantity: material.stockQuantity.toString(),
    lowStockThreshold: material.lowStockThreshold.toString(),
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
    category: material.category ?? null,
  }
}

export interface RecordMaterialMovementData extends MaterialMovementInput {
  materialId: string
  createdById?: string | null
}

export class MaterialRepository {
  async getAll(where: Prisma.MaterialWhereInput = {}): Promise<SerializedMaterial[]> {
    const materials = await prisma.material.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    })
    return materials.map(serializeMaterial)
  }

  async findById(id: string) {
    const material = await prisma.material.findUnique({
      where: { id },
      include: { category: true },
    })
    return material ? serializeMaterial(material) : null
  }

  async deleteById(id: string) {
    return prisma.material.delete({ where: { id } })
  }

  async updateStatus(id: string, isActive: boolean) {
    const material = await prisma.material.update({
      where: { id },
      data: { isActive },
      include: { category: true },
    })
    return serializeMaterial(material)
  }

  async upsert(dto: MaterialUpsertInput): Promise<SerializedMaterial> {
    const data = {
      name: dto.name,
      description: dto.description ?? null,
      unit: dto.unit,
      unitCost: dto.unitCost,
      currency: dto.currency,
      lowStockThreshold: dto.lowStockThreshold ?? 0,
      trackStock: dto.trackStock ?? true,
      isActive: dto.isActive ?? true,
      categoryId: dto.categoryId ?? null,
    }

    if (dto.id) {
      const existing = await prisma.material.findUnique({ where: { id: dto.id } })
      if (!existing) throw new Error("Material not found. Cannot update.")
      const updated = await prisma.material.update({
        where: { id: dto.id },
        data,
        include: { category: true },
      })
      return serializeMaterial(updated)
    }

    const created = await prisma.material.create({
      data,
      include: { category: true },
    })
    return serializeMaterial(created)
  }

  /**
   * Record a stock movement and adjust the material's stock atomically.
   *   IN         → restock (adds quantity); may also update the unit cost.
   *   OUT        → issue to a section (subtracts quantity). Section required.
   *   ADJUSTMENT → set the stock to an exact quantity (e.g. stock-take).
   *
   * Every movement snapshots the unit cost so period cost reports stay accurate.
   */
  async recordMovement(input: RecordMaterialMovementData): Promise<SerializedMaterial> {
    return prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: input.materialId } })
      if (!material) throw new Error("Material not found")

      if (input.type === "OUT" && !input.sectionId) {
        throw new Error("Section is required when issuing material")
      }

      const current = Number(material.stockQuantity)
      const qty = input.quantity

      let newStock: number
      if (input.type === "IN") newStock = current + qty
      else if (input.type === "OUT") newStock = current - qty
      else newStock = qty // ADJUSTMENT sets the exact count

      if (newStock < 0) {
        throw new Error("Insufficient stock for this issuance")
      }

      // Cost override (typically on restock at a new price) updates the
      // material's current unit cost and becomes the snapshot for this movement.
      const unitCostAtMovement =
        input.unitCost !== undefined ? input.unitCost : Number(material.unitCost)

      const updated = await tx.material.update({
        where: { id: input.materialId },
        data: {
          stockQuantity: newStock,
          ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
        },
        include: { category: true },
      })

      await tx.materialMovement.create({
        data: {
          materialId: input.materialId,
          type: input.type,
          quantity: qty,
          sectionId: input.type === "OUT" ? input.sectionId ?? null : null,
          unitCostAtMovement,
          notes: input.notes ?? null,
          createdById: input.createdById ?? null,
        },
      })

      return serializeMaterial(updated)
    })
  }

  async getMovements(materialId: string): Promise<MaterialMovementRow[]> {
    const movements = await prisma.materialMovement.findMany({
      where: { materialId },
      include: { section: true, createdBy: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    })

    return movements.map((m) => ({
      id: m.id,
      materialId: m.materialId,
      type: m.type as MaterialMovementRow["type"],
      quantity: m.quantity.toString(),
      sectionId: m.sectionId,
      section: m.section ? { id: m.section.id, name: m.section.name } : null,
      unitCostAtMovement: m.unitCostAtMovement.toString(),
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      createdBy: m.createdBy ? { username: m.createdBy.username } : null,
    }))
  }

  /**
   * Material cost-by-section report: sums issued (OUT) movements over a date
   * window, grouped by section then material. Cost uses the snapshotted unit
   * cost, so it reflects what each section actually consumed in the period.
   */
  async getUsageBySection(from: Date, to: Date): Promise<SectionUsageReport> {
    const movements = await prisma.materialMovement.findMany({
      where: { type: "OUT", createdAt: { gte: from, lte: to } },
      include: { section: true, material: { select: { name: true, unit: true } } },
    })

    const groups = new Map<string, SectionUsageGroup>()

    for (const m of movements) {
      const key = m.sectionId ?? "__unassigned__"
      const sectionName = m.section?.name ?? "Unassigned"
      const quantity = Number(m.quantity)
      const cost = quantity * Number(m.unitCostAtMovement)

      let group = groups.get(key)
      if (!group) {
        group = { sectionId: m.sectionId, sectionName, totalCost: 0, lines: [] }
        groups.set(key, group)
      }

      let line = group.lines.find((l) => l.materialId === m.materialId)
      if (!line) {
        line = {
          materialId: m.materialId,
          materialName: m.material?.name ?? "Unknown material",
          unit: m.material?.unit ?? "",
          quantity: 0,
          cost: 0,
        }
        group.lines.push(line)
      }

      line.quantity += quantity
      line.cost += cost
      group.totalCost += cost
    }

    const sections = Array.from(groups.values())
      .map((g) => ({
        ...g,
        lines: g.lines.sort((a, b) => b.cost - a.cost),
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    const grandTotal = sections.reduce((sum, s) => sum + s.totalCost, 0)

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      grandTotal,
      sections,
    }
  }
}

export const materialRepository = new MaterialRepository()
