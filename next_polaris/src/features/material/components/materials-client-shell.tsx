"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useGetMaterials,
  useGetSections,
  useDeleteMaterial,
  useToggleMaterialStatus,
  useSeedSections,
  useCreateSection,
  useUpdateSection,
} from "@/features/material/client/use-materials"
import { SerializedMaterial } from "@/features/material/types"
import { materialUsageReportPath } from "@/app/paths"
import MaterialFormModal from "./material-form-modal"
import MaterialMovementModal from "./material-movement-modal"
import MaterialHistoryModal from "./material-history-modal"
import {
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Pencil,
  Trash2,
  BarChart3,
  AlertTriangle,
} from "lucide-react"

export default function MaterialsClientShell() {
  const { data: materials, isLoading } = useGetMaterials()
  const { data: sections } = useGetSections()
  const deleteMaterial = useDeleteMaterial()
  const toggleStatus = useToggleMaterialStatus()
  const seedSections = useSeedSections()
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SerializedMaterial | null>(null)
  const [movementFor, setMovementFor] = useState<{ material: SerializedMaterial; type: "IN" | "OUT" } | null>(null)
  const [historyFor, setHistoryFor] = useState<SerializedMaterial | null>(null)
  const [newSection, setNewSection] = useState("")
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState("")

  const startEditSection = (id: string, name: string) => { setEditingSectionId(id); setEditingSectionName(name) }
  const cancelEditSection = () => { setEditingSectionId(null); setEditingSectionName("") }
  const saveEditSection = (id: string) => {
    const name = editingSectionName.trim()
    if (!name) return
    updateSection.mutate({ id, name }, { onSuccess: cancelEditSection })
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (m: SerializedMaterial) => { setEditing(m); setFormOpen(true) }

  const isLow = (m: SerializedMaterial) =>
    m.trackStock && Number(m.lowStockThreshold) > 0 && Number(m.stockQuantity) <= Number(m.lowStockThreshold)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
          <p className="text-sm text-gray-500">Consumables issued to sections, tracked for cost accounting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={materialUsageReportPath()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4" />
            Cost report
          </Link>
          <Button onClick={openCreate} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add material
          </Button>
        </div>
      </div>

      {/* Sections bar */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-gray-700">Sections</p>
          {(!sections || sections.length === 0) && (
            <Button variant="outline" size="sm" onClick={() => seedSections.mutate()} disabled={seedSections.isPending}>
              {seedSections.isPending ? "Setting up…" : "Set up from service categories"}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sections?.map((s) =>
            editingSectionId === s.id ? (
              <span key={s.id} className="inline-flex items-center gap-1">
                <Input
                  autoFocus
                  value={editingSectionName}
                  onChange={(e) => setEditingSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditSection(s.id)
                    if (e.key === "Escape") cancelEditSection()
                  }}
                  className="h-8 w-40 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!editingSectionName.trim() || updateSection.isPending}
                  onClick={() => saveEditSection(s.id)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditSection} disabled={updateSection.isPending}>
                  Cancel
                </Button>
              </span>
            ) : (
              <span
                key={s.id}
                className={`group inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full ${s.isActive ? "bg-fuchsia-50 text-fuchsia-700" : "bg-gray-100 text-gray-400"}`}
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => startEditSection(s.id, s.name)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  title="Rename section"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </span>
            )
          )}
          <div className="flex items-center gap-1">
            <Input
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="Add section…"
              className="h-8 w-40 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newSection.trim() || createSection.isPending}
              onClick={() => { createSection.mutate({ name: newSection.trim() }); setNewSection("") }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Materials list */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        ) : !materials || materials.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No materials yet. Add your first one.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {materials.map((m) => (
              <div key={m.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${!m.isActive ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    {isLow(m) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Low stock
                      </span>
                    )}
                    {!m.isActive && <span className="text-[10px] text-gray-400">inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {Number(m.stockQuantity)} {m.unit} in stock · GHS {Number(m.unitCost).toFixed(2)}/{m.unit}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <IconBtn title="Issue to section" onClick={() => setMovementFor({ material: m, type: "OUT" })}>
                    <ArrowUpCircle className="w-4 h-4 text-fuchsia-600" />
                  </IconBtn>
                  <IconBtn title="Restock" onClick={() => setMovementFor({ material: m, type: "IN" })}>
                    <ArrowDownCircle className="w-4 h-4 text-green-600" />
                  </IconBtn>
                  <IconBtn title="History" onClick={() => setHistoryFor(m)}>
                    <History className="w-4 h-4 text-gray-500" />
                  </IconBtn>
                  <IconBtn title="Edit" onClick={() => openEdit(m)}>
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </IconBtn>
                  <button
                    onClick={() => toggleStatus.mutate({ id: m.id, isActive: !m.isActive })}
                    className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {m.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <IconBtn title="Delete" onClick={() => {
                    if (confirm(`Delete "${m.name}"? This cannot be undone.`)) deleteMaterial.mutate(m.id)
                  }}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <MaterialFormModal open={formOpen} onClose={() => setFormOpen(false)} material={editing} />
      {movementFor && (
        <MaterialMovementModal
          material={movementFor.material}
          initialType={movementFor.type}
          open={!!movementFor}
          onClose={() => setMovementFor(null)}
        />
      )}
      {historyFor && (
        <MaterialHistoryModal material={historyFor} open={!!historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  )
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
      {children}
    </button>
  )
}
