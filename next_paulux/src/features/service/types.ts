import { Service, ServiceCategory } from "@generated/prisma/client";

export type SerializedService = Omit<Service, 'price' | 'minDepositFixed' | 'createdAt' | 'updatedAt'> & {
  price: string;
  minDepositFixed: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Pick<ServiceCategory, 'id' | 'name' | 'capacity'> | null;
}

export type SerializedServiceCategory = Omit<ServiceCategory, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
  _count?: { services: number };
}