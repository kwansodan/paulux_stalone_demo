export type RoleWithCount = {
  id: string
  name: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}
