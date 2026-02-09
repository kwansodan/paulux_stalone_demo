"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import MobileMenu from "../mobile-menu/mobile-menu"
import { useState } from "react"
import Link from "next/link"
import { homePath } from "@/app/paths"

export default function LandingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-4">
      <Link href={homePath()} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border-2 border-fuchsia-400" />
        </div>
        <span className="font-semibold text-xl text-gray-900">PolarisBooking</span>
      </Link>

      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      <MobileMenu open={open} onOpenChange={setOpen}/>
    </header>
  )
}
