"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import axios from "axios"

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

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setLoading(true)
            const formData = new FormData()
            formData.append("file", file)

            const response = await axios.post("/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.success) {
                onChange(response.data.url)
            }
        } catch (error) {
            console.error("Upload failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const onRemove = () => {
        onChange(null)
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden border border-gray-200 shadow-sm">
                        <div className="z-10 absolute top-2 right-2">
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
                            className="object-cover"
                            alt="Uploaded image"
                            src={value}
                        />
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-[200px] h-[200px] border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all duration-200">
                        {loading ? (
                            <Loader2 className="h-8 w-8 text-fuchsia-600 animate-spin" />
                        ) : (
                            <>
                                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">Upload Image</span>
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            onChange={onUpload}
                            disabled={disabled || loading}
                            accept="image/*"
                        />
                    </label>
                )}
            </div>
        </div>
    )
}
