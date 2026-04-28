import { prisma } from "@/lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { ServiceUpsertInput } from "../utils/validation";
import { SerializedService } from "../types";

// Helper to patch legacy database URLs
const patchLegacyUrl = (url: string | null) => {
  if (!url) return url;
  return url.replace('polarisbeauty.biz', 'polarisbeautylounge.com');
}

export class ServiceRepository {

  async getAllServices(where: Prisma.ServiceWhereInput): Promise<SerializedService[]> {
    const services = await prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    return services.map(service => ({
      ...service,
      price: service.price.toString(),
      imageUrl: patchLegacyUrl(service.imageUrl),
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      category: service.category ?? null,
    }))
  }

  async findById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });

    if (service) {
      service.imageUrl = patchLegacyUrl(service.imageUrl);
    }

    return service;
  }

  async deleteById(id: string) {
    return prisma.service.delete({
      where: {
        id
      }
    })
  }

  async updateStatus(id: string, isActive: boolean) {
    return prisma.service.update({
      where: {
        id
      },
      data: {
        isActive: isActive
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    })
  }

  async upsertService(upsertDTO: ServiceUpsertInput): Promise<SerializedService> {
    let upsertedService;
    if (upsertDTO.id) {
      const existing = await prisma.service.findUnique({
        where: { id: upsertDTO.id }
      })

      if (!existing) {
        throw new Error("Service not found. Cannot update.")
      }

      upsertedService = await prisma.service.update({
        where: { id: upsertDTO.id },
        data: {
          name: upsertDTO.name,
          description: upsertDTO.description,
          durationMinutes: upsertDTO.durationMinutes,
          price: upsertDTO.price,
          currency: upsertDTO.currency,
          maxBookingsPerDay: upsertDTO.maxBookingsPerDay,
          latestBookingTime: upsertDTO.latestBookingTime,
          minDepositFixed: upsertDTO.minDepositFixed,
          isActive: upsertDTO.isActive,
          imageUrl: upsertDTO.imageUrl,
          categoryId: upsertDTO.categoryId ?? null,
        },
        include: { category: true },
      })
    } else {
      upsertedService = await prisma.service.create({
        data: {
          name: upsertDTO.name,
          description: upsertDTO.description,
          durationMinutes: upsertDTO.durationMinutes,
          price: upsertDTO.price,
          currency: upsertDTO.currency,
          maxBookingsPerDay: upsertDTO.maxBookingsPerDay,
          latestBookingTime: upsertDTO.latestBookingTime,
          minDepositFixed: upsertDTO.minDepositFixed,
          isActive: upsertDTO.isActive,
          imageUrl: upsertDTO.imageUrl,
          categoryId: upsertDTO.categoryId ?? null,
        },
        include: { category: true },
      })
    }

    const serializedService = {
      ...upsertedService,
      price: upsertedService.price.toString(),
      imageUrl: patchLegacyUrl(upsertedService.imageUrl),
      createdAt: upsertedService.createdAt.toISOString(),
      updatedAt: upsertedService.updatedAt.toISOString(),
      category: upsertedService.category ?? null,
    }

    return serializedService
  }
}

export const serviceRepository = new ServiceRepository()