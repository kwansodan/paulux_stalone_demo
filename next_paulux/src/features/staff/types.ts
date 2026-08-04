export interface StaffMember {
  id: string
  username: string
  email: string
  phone: string | null
  role: string
  isStylist: boolean
  isActive: boolean
  customRoleId: string | null
  customRole: { id: string; name: string } | null
  createdAt: string
}
