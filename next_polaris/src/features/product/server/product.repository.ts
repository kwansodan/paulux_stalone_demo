import { prisma } from "@/lib/prisma"
import { Prisma } from "@generated/prisma/client"
import { ProductUpsertInput } from "../utils/validation"
import { SerializedProduct } from "../types"

export class ProductRepository {

  async getAllProducts(where: Prisma.ProductWhereInput): Promise<SerializedProduct[]> {
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    return products.map((product) => ({
      ...product,
      price: product.price.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      category: product.category ?? null,
    }))
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
  }

  async deleteById(id: string) {
    return prisma.product.delete({ where: { id } })
  }

  async updateStatus(id: string, isActive: boolean) {
    return prisma.product.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    })
  }

  async upsertProduct(upsertDTO: ProductUpsertInput): Promise<SerializedProduct> {
    let upserted

    if (upsertDTO.id) {
      const existing = await prisma.product.findUnique({ where: { id: upsertDTO.id } })
      if (!existing) throw new Error("Product not found. Cannot update.")

      upserted = await prisma.product.update({
        where: { id: upsertDTO.id },
        data: {
          name: upsertDTO.name,
          description: upsertDTO.description,
          price: upsertDTO.price,
          currency: upsertDTO.currency,
          isActive: upsertDTO.isActive,
          imageUrl: upsertDTO.imageUrl,
          categoryId: upsertDTO.categoryId ?? null,
        },
        include: { category: true },
      })
    } else {
      upserted = await prisma.product.create({
        data: {
          name: upsertDTO.name,
          description: upsertDTO.description,
          price: upsertDTO.price,
          currency: upsertDTO.currency,
          isActive: upsertDTO.isActive,
          imageUrl: upsertDTO.imageUrl,
          categoryId: upsertDTO.categoryId ?? null,
        },
        include: { category: true },
      })
    }

    return {
      ...upserted,
      price: upserted.price.toString(),
      createdAt: upserted.createdAt.toISOString(),
      updatedAt: upserted.updatedAt.toISOString(),
      category: upserted.category ?? null,
    }
  }
}

export const productRepository = new ProductRepository()
