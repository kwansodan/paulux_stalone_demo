import { prisma } from "@/lib/prisma"
import { SectionInput } from "../utils/validation"
import { SerializedSection } from "../types"

function serializeSection(section: any): SerializedSection {
  return {
    ...section,
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  }
}

export class SectionRepository {
  async getAll(activeOnly = false): Promise<SerializedSection[]> {
    const sections = await prisma.section.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
    return sections.map(serializeSection)
  }

  async create(input: SectionInput): Promise<SerializedSection> {
    const section = await prisma.section.create({
      data: {
        name: input.name,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return serializeSection(section)
  }

  async update(id: string, input: Partial<SectionInput>): Promise<SerializedSection> {
    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    })
    return serializeSection(section)
  }

  /**
   * Idempotently seed sections from the existing service categories plus a few
   * defaults, so materials can be issued to sections out of the box.
   */
  async seedFromServiceCategories(): Promise<SerializedSection[]> {
    const [categories, existing] = await Promise.all([
      prisma.serviceCategory.findMany({ select: { name: true } }),
      prisma.section.findMany({ select: { name: true } }),
    ])

    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()))
    const candidates = [
      ...categories.map((c) => c.name),
      "Barber",
      "Other",
    ]

    const toCreate = candidates.filter((name, i, arr) => {
      const lower = name.toLowerCase()
      if (existingNames.has(lower)) return false
      // de-dupe within the candidate list itself
      return arr.findIndex((n) => n.toLowerCase() === lower) === i
    })

    if (toCreate.length > 0) {
      await prisma.section.createMany({
        data: toCreate.map((name, i) => ({ name, sortOrder: i })),
        skipDuplicates: true,
      })
    }

    return this.getAll()
  }
}

export const sectionRepository = new SectionRepository()
