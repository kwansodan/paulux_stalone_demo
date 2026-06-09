"use client"

import { useState } from "react"
import { Plus, Scissors, Phone, Mail, Copy, Eye, EyeOff, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/components/modal"
import { useGetStaff, useCreateStaff, useUpdateStaffRole } from "../client/use-staff"
import { StaffMember } from "../types"
import { RoleWithCount } from "@/features/roles/types"
import { toast } from "sonner"

export default function StaffShell({
  initialStaff,
  availableRoles = [],
}: {
  initialStaff: StaffMember[]
  availableRoles?: RoleWithCount[]
}) {
  const { data: staff = initialStaff } = useGetStaff()
  const createMutation = useCreateStaff()
  const updateRoleMutation = useUpdateStaffRole()

  const [addOpen, setAddOpen] = useState(false)
  const [createdResult, setCreatedResult] = useState<{ staff: StaffMember; tempPassword: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [formError, setFormError] = useState("")

  function openAdd() {
    setUsername("")
    setEmail("")
    setPhone("")
    setFormError("")
    setAddOpen(true)
  }

  async function handleCreate() {
    setFormError("")
    if (!username.trim() || username.trim().length < 2) {
      setFormError("Display name must be at least 2 characters")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("A valid email address is required")
      return
    }
    try {
      const res = await createMutation.mutateAsync({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      })
      setAddOpen(false)
      setCreatedResult({ staff: res.data.staff, tempPassword: res.data.tempPassword })
      setShowPassword(false)
    } catch {
      // error handled by mutation
    }
  }

  function copyPassword() {
    if (createdResult) {
      navigator.clipboard.writeText(createdResult.tempPassword)
      toast.success("Password copied to clipboard")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-sm text-gray-500">
          Manage your salon stylists. Assign them to bookings from the Bookings page.
        </p>
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={openAdd}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Stylist
        </Button>
      </div>

      {/* Empty state */}
      {staff.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No stylists yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add your first stylist to start assigning them to bookings.
          </p>
        </div>
      )}

      {/* Staff grid */}
      {staff.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {staff.map((member) => (
            <Card
              key={member.id}
              className="rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-5 space-y-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.username}</p>
                    <span className="text-[10px] font-semibold bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">
                      Stylist
                    </span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Role assignment */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {availableRoles.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No roles created yet</span>
                  ) : (
                    <select
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                      value={member.customRoleId ?? ""}
                      disabled={updateRoleMutation.isPending}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          id: member.id,
                          customRoleId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">— No role —</option>
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Added date */}
                <p className="text-xs text-gray-400">
                  Added {new Date(member.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add stylist modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Stylist"
        childrenClassName="max-h-[420px]"
        showSeparator
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-sm font-normal">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Ama Owusu"
              className="h-12 bg-white border-[#E2E8F0] rounded-lg shadow-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-normal">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="stylist@example.com"
              className="h-12 bg-white border-[#E2E8F0] rounded-lg shadow-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-normal">Phone (optional)</Label>
            <Input
              placeholder="+233 xx xxx xxxx"
              className="h-12 bg-white border-[#E2E8F0] rounded-lg shadow-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-fuchsia-700 hover:bg-fuchsia-600"
              disabled={createMutation.isPending}
              onClick={handleCreate}
            >
              {createMutation.isPending ? "Creating..." : "Add Stylist"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Temp password modal — shown once after creation */}
      <Modal
        open={!!createdResult}
        onClose={() => setCreatedResult(null)}
        title="Stylist Added"
        subtitle={`${createdResult?.staff.username} has been added. Share their temporary password below — it won't be shown again.`}
        childrenClassName="max-h-[300px]"
        showSeparator={false}
      >
        <div className="space-y-4 py-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Temporary Password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-lg font-bold text-gray-900 tracking-widest">
                {showPassword ? createdResult?.tempPassword : "••••••••••"}
              </code>
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={copyPassword}
                className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            The stylist can log in with <strong>{createdResult?.staff.email}</strong> and change their password after first login.
          </p>
          <div className="flex justify-end pt-1">
            <Button
              className="bg-fuchsia-700 hover:bg-fuchsia-600"
              onClick={() => setCreatedResult(null)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
