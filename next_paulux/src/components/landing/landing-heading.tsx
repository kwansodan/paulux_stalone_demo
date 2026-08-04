"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import MobileMenu from "../mobile-menu/mobile-menu"
import { useState } from "react"
import Link from "next/link"
import { homePath } from "@/app/paths"
import Image  from "next/image"

export default function LandingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 py-4">
      <Link href={homePath()} className="flex items-center gap-2">
        <Image
          src="/images/pauluxicon.png"
          alt="Company Logo"
          width={100}
          height={50}
          priority
        />
      </Link>

      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      <MobileMenu open={open} onOpenChange={setOpen} />
    </header>
  )
}
