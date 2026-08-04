"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ServicesHeader() {
  return (
    <div className="bg-white border-b">
      <div className="flex items-center gap-3 px-4 py-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="bg-gray-50 rounded-full p-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div>
          <h1 className="text-lg font-semibold">Our Services</h1>
          <p className="text-sm text-gray-500">
            Choose a service that fits you
          </p>
        </div>
      </div>
    </div>
  )
}
