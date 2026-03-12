"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2, UploadCloud } from "lucide-react"
import Image from "next/image"
import axios from "axios"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string | null) => void
    disabled?: boolean
}

export default function ImageUpload({
    value,
    onChange,
    disabled
}: ImageUploadProps) {
    const [loading, setLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const handleUpload = useCallback(async (file: File) => {
        try {
            setLoading(true)

            // 1. Get presigned URL from backend
            const { data: presignData } = await axios.post("/api/upload/presign", {
                filename: file.name,
                fileType: file.type
            })

            if (!presignData.success) {
                throw new Error("Failed to get presigned URL")
            }

            // 2. Upload directly to MinIO using the presigned URL
            // We use axios.put to transfer the raw file data
            await axios.put(presignData.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            })

            // 3. Update the form with the final public URL
            onChange(presignData.publicUrl)

        } catch (error) {
            console.error("Upload failed:", error)
        } finally {
            setLoading(false)
        }
    }, [onChange])

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled && !loading) setIsDragging(true)
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (disabled || loading) return

        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith("image/")) {
            handleUpload(file)
        }
    }

    const onRemove = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onChange(null)
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-[200px] h-[200px] rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <div className="z-10 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                onClick={onRemove}
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-md"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            unoptimized
                            className="object-cover"
                            alt="Uploaded image"
                            src={value}
                        />
                    </div>
                ) : (
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={cn(
                            "relative flex flex-col items-center justify-center w-[200px] h-[200px] border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
                            isDragging
                                ? "border-fuchsia-500 bg-fuchsia-50 scale-[1.02]"
                                : "border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50/30",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            {loading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 text-fuchsia-600 animate-spin" />
                                    <span className="text-xs font-medium text-fuchsia-600">Uploading...</span>
                                </div>
                            ) : isDragging ? (
                                <div className="flex flex-col items-center gap-2 animate-bounce">
                                    <UploadCloud className="h-10 w-10 text-fuchsia-600" />
                                    <span className="text-xs font-semibold text-fuchsia-600">Drop to upload</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 px-4 text-center">
                                    <div className="p-3 bg-fuchsia-50 rounded-full group-hover:bg-fuchsia-100 transition-colors">
                                        <ImagePlus className="h-6 w-6 text-fuchsia-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-sm font-semibold text-gray-700 block">Click or drag</span>
                                        <span className="text-[10px] text-gray-500">PNG, JPG up to 5MB</span>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                onChange={onFileSelect}
                                disabled={disabled || loading}
                                accept="image/*"
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    )
}
