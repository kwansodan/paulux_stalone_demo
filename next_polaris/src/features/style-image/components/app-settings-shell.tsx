"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import axios from "axios"
import { Plus, CircleX, PencilLine, GalleryHorizontal, ToggleLeft, ToggleRight, Loader2, Mail, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Modal from "@/components/modal"
import ImageUpload from "@/components/ui/image-upload"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
  StyleImage,
  useGetStyleImages,
  useCreateStyleImage,
  useUpdateStyleImage,
  useDeleteStyleImage,
} from "../client/use-style-images"

// ── Upload helper that adds folder=style_images ───────────────────────────────
async function uploadStyleImage(file: File): Promise<{ publicUrl: string; objectName: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await axios.post<{ success: boolean; publicUrl: string; objectName: string }>(
    "/api/upload?folder=style_images",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  if (!data.success) throw new Error("Upload failed")
  return { publicUrl: data.publicUrl, objectName: data.objectName }
}

// ── Custom ImageUpload wrapper that captures objectName ───────────────────────
function StyleImageUpload({
  value,
  onChange,
}: {
  value: { url: string; objectName: string } | null
  onChange: (v: { url: string; objectName: string } | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    try {
      setUploading(true)
      const result = await uploadStyleImage(file)
      onChange(result ? { url: result.publicUrl, objectName: result.objectName } : null)
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  if (value) {
    return (
      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
        <Image src={value.url} alt="Style image" fill className="object-cover" unoptimized />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <CircleX className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <label
      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        isDragging ? "border-fuchsia-500 bg-fuchsia-50" : "border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file?.type.startsWith("image/")) handleFile(file)
      }}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-fuchsia-600 animate-spin" />
          <span className="text-xs text-fuchsia-600 font-medium">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <div className="p-3 bg-fuchsia-50 rounded-full">
            <GalleryHorizontal className="w-6 h-6 text-fuchsia-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Click or drag to upload</span>
          <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </label>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export default function AppSettingsShell({
  initialImages,
  initialWalkinEmail,
}: {
  initialImages: StyleImage[]
  initialWalkinEmail: string
}) {
  const { data: images = initialImages } = useGetStyleImages()
  const createMutation = useCreateStyleImage()
  const updateMutation = useUpdateStyleImage()
  const deleteMutation = useDeleteStyleImage()

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StyleImage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StyleImage | null>(null)

  // Add form state
  const [newImage, setNewImage] = useState<{ url: string; objectName: string } | null>(null)
  const [newCaption, setNewCaption] = useState("")

  // Edit form state
  const [editCaption, setEditCaption] = useState("")

  // Walk-in email state
  const [walkinEmail, setWalkinEmail] = useState(initialWalkinEmail)
  const [walkinEmailInput, setWalkinEmailInput] = useState(initialWalkinEmail)
  const [walkinEmailSaving, setWalkinEmailSaving] = useState(false)

  async function handleSaveWalkinEmail() {
    setWalkinEmailSaving(true)
    try {
      const res = await api.patch("/settings/walkin-email", { email: walkinEmailInput })
      setWalkinEmail(res.data.data.email)
      toast.success("Walk-in email updated")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update walk-in email")
    } finally {
      setWalkinEmailSaving(false)
    }
  }

  function openAdd() {
    setNewImage(null)
    setNewCaption("")
    setAddOpen(true)
  }

  function openEdit(img: StyleImage) {
    setEditTarget(img)
    setEditCaption(img.caption ?? "")
  }

  async function handleAdd() {
    if (!newImage) return
    await createMutation.mutateAsync({
      url: newImage.url,
      objectName: newImage.objectName,
      caption: newCaption || undefined,
    })
    setAddOpen(false)
  }

  async function handleEditSave() {
    if (!editTarget) return
    await updateMutation.mutateAsync({ id: editTarget.id, caption: editCaption || null })
    setEditTarget(null)
  }

  async function handleToggleActive(img: StyleImage) {
    await updateMutation.mutateAsync({ id: img.id, isActive: !img.isActive })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-10">
      {/* ── Walk-in Bookings section ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Walk-in Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            This email is used as a Paystack billing email for walk-in customers who don&apos;t provide their own email.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 max-w-lg">
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>Receipts for walk-in Paystack payments are sent to this address.</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Walk-in Paystack Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                className="h-11 bg-white border-[#E2E8F0] rounded-lg shadow-none flex-1"
                value={walkinEmailInput}
                onChange={(e) => setWalkinEmailInput(e.target.value)}
                placeholder="walkin@example.com"
              />
              <Button
                className="h-11 bg-fuchsia-600 hover:bg-fuchsia-700 px-4"
                disabled={walkinEmailSaving || walkinEmailInput.trim() === walkinEmail}
                onClick={handleSaveWalkinEmail}
              >
                {walkinEmailSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Save className="w-4 h-4 mr-1.5" />Save</>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">Current: <span className="font-mono text-gray-600">{walkinEmail}</span></p>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Hero Slideshow section ── */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hero Slideshow</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Images cycle as the background of the landing page hero. Toggle images on or off without deleting them.
            </p>
          </div>
          <Button
            className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
            onClick={openAdd}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Image
          </Button>
        </div>

        {/* Empty state */}
        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <GalleryHorizontal className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold text-lg">No images yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload style images to display in the hero slideshow on the landing page.
            </p>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {images.map((img) => (
              <Card
                key={img.id}
                className={`rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                  !img.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-full h-44">
                  <Image src={img.url} alt={img.caption ?? "Style image"} fill className="object-cover" unoptimized />
                  {!img.isActive && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                      <span className="text-xs font-semibold bg-gray-800/70 text-white px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-gray-600 truncate">
                    {img.caption || <span className="text-gray-400 italic">No caption</span>}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(img)}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-fuchsia-600 transition-colors"
                    >
                      {img.isActive ? (
                        <ToggleRight className="w-5 h-5 text-fuchsia-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                      {img.isActive ? "Active" : "Hidden"}
                    </button>

                    {/* Edit / Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(img)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        <PencilLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(img)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-500"
                      >
                        <CircleX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Style Image"
        childrenClassName="max-h-[520px]"
        showSeparator
      >
        <div className="space-y-4 pt-2">
          <StyleImageUpload value={newImage} onChange={setNewImage} />
          <div className="space-y-1">
            <Label className="text-sm font-normal">Caption (optional)</Label>
            <Input
              placeholder="e.g. Summer glow look"
              className="h-12 bg-white border-[#E2E8F0] rounded-lg shadow-none"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-fuchsia-700 hover:bg-fuchsia-600"
              disabled={!newImage || createMutation.isPending}
              onClick={handleAdd}
            >
              {createMutation.isPending ? "Saving..." : "Add Image"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Caption"
        childrenClassName="max-h-64"
        showSeparator
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-sm font-normal">Caption</Label>
            <Input
              placeholder="e.g. Summer glow look"
              className="h-12 bg-white border-[#E2E8F0] rounded-lg shadow-none"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              className="bg-fuchsia-700 hover:bg-fuchsia-600"
              disabled={updateMutation.isPending}
              onClick={handleEditSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Image?"
        subtitle="This will permanently remove the image from the slideshow and from storage. This action cannot be undone."
        childrenClassName="max-h-56 w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            className="bg-[#D10505] hover:bg-[#D10505]/90"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
