import { Product, ProductCategory } from "@generated/prisma/client"

// Defined locally — local Prisma client doesn't have this until db push runs on the server
export enum StockMovementType {
  IN = "IN",
  OUT = "OUT",
  ADJUSTMENT = "ADJUSTMENT",
}

export type SerializedProduct = Omit<Product, 'price' | 'createdAt' | 'updatedAt'> & {
  price: string
  createdAt: string
  updatedAt: string
  category?: Pick<ProductCategory, 'id' | 'name'> | null
  // Added in schema update — present at runtime after db push
  stockQuantity: number
  lowStockThreshold: number
}

export type StockMovement = {
  id: string
  productId: string
  type: StockMovementType
  quantity: number
  notes: string | null
  createdAt: string
  createdBy: { username: string } | null
}
