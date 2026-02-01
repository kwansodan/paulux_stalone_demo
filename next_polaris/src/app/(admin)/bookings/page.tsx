import { requireRole } from "@/app/_auth/require-role"
import BookingClientShell from "@/features/booking/components/booking-client-shell"
import { serviceRepository } from "@/features/service/server/service.repository"
import { UserRole } from "@generated/prisma/enums"

export default async function BookingsPage() {
  const user = await requireRole([UserRole.ADMIN])

  const services = await serviceRepository.getAllServices({ isActive: true })

  return (
    <BookingClientShell services={services} user={user}/>
  )
}
