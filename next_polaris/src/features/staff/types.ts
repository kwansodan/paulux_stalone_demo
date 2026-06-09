export interface StaffMember {
  id: string
  username: string
  email: string
  phone: string | null
  role: string
  customRoleId: string | null
  customRole: { id: string; name: string } | null
  createdAt: string
}
