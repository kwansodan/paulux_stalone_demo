"use client"

import { useState } from "react"
import { Plus, Shield, Users, Pencil, Trash2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/components/modal"
import { RoleWithCount } from "../types"
import { useGetRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../client/use-roles"
import { PERMISSION_AREAS } from "@/lib/permissions"

// ─── Permission checkbox grid ─────────────────────────────────────────────────
function PermissionGrid({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (keys: string[]) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSION_AREAS.map((a) => [a.area, true]))
  )

  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }

  function toggleArea(areaKeys: string[]) {
    const allSelected = areaKeys.every((k) => selected.includes(k))
    if (allSelected) {
      onChange(selected.filter((k) => !areaKeys.includes(k)))
    } else {
      const toAdd = areaKeys.filter((k) => !selected.includes(k))
      onChange([...selected, ...toAdd])
    }
  }

  return (
    <div className="space-y-3">
      {PERMISSION_AREAS.map((group) => {
        const areaKeys = group.items.map((i) => i.key)
        const allSelected = areaKeys.every((k) => selected.includes(k))
        const someSelected = areaKeys.some((k) => selected.includes(k))
        const isOpen = expanded[group.area] ?? true

        return (
          <div key={group.area} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 flex-1 text-left"
                onClick={() => setExpanded((e) => ({ ...e, [group.area]: !isOpen }))}
              >
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                {group.area}
                {someSelected && !allSelected && (
                  <span className="text-[10px] font-medium text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded-full">partial</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleArea(areaKeys)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  allSelected
                    ? "text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            {isOpen && (
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(item.key)}
                      onChange={() => toggle(item.key)}
                      className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Role form modal ──────────────────────────────────────────────────────────
function RoleFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: RoleWithCount | null
}) {
  const isEdit = !!initial
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()

  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? [])
  const [error, setError] = useState("")

  async function handleSave() {
    setError("")
    if (!name.trim()) { setError("Role name is required"); return }
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, name: name.trim(), description: description.trim() || null, permissions })
      } else {
        await createMutation.mutateAsync({ name: name.trim(), description: description.trim() || undefined, permissions })
      }
      onClose()
    } catch {
      // handled by mutation
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Role" : "Create Role"}
      subtitle={isEdit ? `Editing "${initial?.name}"` : "Define a name and the areas this role can access."}
      childrenClassName="max-h-[600px]"
      showSeparator
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <Label className="text-sm font-normal">Role name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g. Receptionist, Senior Stylist"
            className="h-11 bg-white border-[#E2E8F0] rounded-lg shadow-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-normal">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input
            placeholder="Brief description of this role"
            className="h-11 bg-white border-[#E2E8F0] rounded-lg shadow-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">Permissions</Label>
            <span className="text-xs text-gray-400">{permissions.length} selected</span>
          </div>
          <PermissionGrid selected={permissions} onChange={setPermissions} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            className="bg-fuchsia-700 hover:bg-fuchsia-600"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteRoleModal({ role, onClose }: { role: RoleWithCount | null; onClose: () => void }) {
  const deleteMutation = useDeleteRole()

  async function handleDelete() {
    if (!role) return
    await deleteMutation.mutateAsync(role.id)
    onClose()
  }

  return (
    <Modal
      open={!!role}
      onClose={onClose}
      title="Delete Role?"
      subtitle={
        role
          ? role.userCount > 0
            ? `"${role.name}" is assigned to ${role.userCount} user${role.userCount === 1 ? "" : "s"}. They will lose this role. This cannot be undone.`
            : `"${role.name}" will be permanently deleted. This cannot be undone.`
          : ""
      }
      childrenClassName="max-h-52"
      showSeparator={false}
    >
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>Cancel</Button>
        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete Role"}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────
export default function RolesShell({ initialRoles }: { initialRoles: RoleWithCount[] }) {
  const { data: roles = initialRoles } = useGetRoles()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RoleWithCount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleWithCount | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Roles define what areas of the application a staff member can access. Assign roles to users in the Staff section.
        </p>
        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Role
        </Button>
      </div>

      {/* Empty state */}
      {roles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No roles yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first role to start controlling staff access.
          </p>
        </div>
      )}

      {/* Role cards */}
      {roles.length > 0 && (
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{role.name}</p>
                    {role.isSystem && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">system</span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-500 truncate">{role.description}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
                  <span>{role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditTarget(role)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                  title="Edit role"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => setDeleteTarget(role)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-500"
                    title="Delete role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RoleFormModal key="create" open={createOpen} onClose={() => setCreateOpen(false)} />
      <RoleFormModal key={editTarget?.id ?? "edit"} open={!!editTarget} onClose={() => setEditTarget(null)} initial={editTarget} />
      <DeleteRoleModal role={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  )
}
