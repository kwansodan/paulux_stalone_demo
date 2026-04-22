import { Product, ProductCategory } from "@generated/prisma/client"

export type SerializedProduct = Omit<Product, 'price' | 'createdAt' | 'updatedAt'> & {
  price: string
  createdAt: string
  updatedAt: string
  category?: Pick<ProductCategory, 'id' | 'name'> | null
}
