import { prisma } from "@/lib/prisma";
import { BusinessHourInput } from "../utils/validation";

export class BusinessHourRepository {

  update(dto: BusinessHourInput) {
    return prisma.businessHour.update({
      where: { dayOfWeek: dto.dayOfWeek },
      data: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        isOpen: dto.isOpen,
      },
    });
  }

  getAll() {
    return prisma.businessHour.findMany({
      orderBy: { dayOfWeek: "asc" },
    });
  }

  findByDayOfWeek(dayOfWeek: number) {
    return prisma.businessHour.findUnique({
      where: { dayOfWeek },
    });
  }

  updateStatus(dayOfWeek: number, isOpen: boolean) {
    return prisma.businessHour.update({
      where: { dayOfWeek },
      data: {
        isOpen
      }
    });
  }

  deleteByDayOfWeek(dayOfWeek: number) {
    return prisma.businessHour.delete({
      where: { dayOfWeek },
    });
  }
}

export const businessHourRepository = new BusinessHourRepository();
