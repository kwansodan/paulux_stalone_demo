import { prisma } from "@/lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { ServiceUpsertInput } from "../utils/validation";
import { SerializedService } from "../types";

export class ServiceRepository {

  async getAllServices(where: Prisma.ServiceWhereInput): Promise<SerializedService[]> {
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      }
    })

    return services.map(service => ({
      ...service,
      price: service.price.toString(),
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString()
    }))
  }

  async findById(id: string) {
    return prisma.service.findUnique({
      where: {
        id
      }
    })
  }

  async deleteById(id: string) {
    return prisma.service.delete({
      where: {
        id
      }
    })
  }

  async upsertService(upsertDTO: ServiceUpsertInput): Promise<SerializedService> {

    const upsertedService = await prisma.service.upsert({
      where: {
        id: upsertDTO.id,
      },
      update: {
        name: upsertDTO.name,
        description: upsertDTO.description,
        durationMinutes: upsertDTO.durationMinutes,
        price: upsertDTO.price,
        currency: upsertDTO.currency,
        isActive: upsertDTO.isActive,
      },
      create: {
        name: upsertDTO.name,
        description: upsertDTO.description,
        durationMinutes: upsertDTO.durationMinutes,
        price: upsertDTO.price,
        currency: upsertDTO.currency,
        isActive: upsertDTO.isActive,
      }
    })

    const serializedService = {
      ...upsertedService,
      price: upsertedService.price.toString(),
      createdAt: upsertedService.createdAt.toISOString(),
      updatedAt: upsertedService.updatedAt.toISOString()
    }

    return serializedService
  }
}

export const serviceRepository = new ServiceRepository()