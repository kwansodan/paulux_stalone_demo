import { SerializedService } from "@/features/service/types"

export interface SerializedPackage {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: string
  currency: string
  minDepositFixed: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  services: Array<{
    packageId: string
    serviceId: string
    service: SerializedService
  }>
}
