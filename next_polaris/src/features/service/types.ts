import { Service } from "@generated/prisma/client";

export type SerializedService = Omit<Service, 'price' | 'createdAt' | 'updatedAt'> & {
  price: string;
  createdAt: string;
  updatedAt: string;
}