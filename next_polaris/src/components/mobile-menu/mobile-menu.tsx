"use client"

import { X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { SOCIAL_ICONS } from "../landing/landing-footer"
import "./mobile-menu.css"
import Link from "next/link"
import { customerBookingPath, customerServicesPath } from "@/app/paths"

export default function MobileMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className={cn(
            "mobile-menu fixed inset-0 z-50 bg-white",
            "focus:outline-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-fuchsia-400" />
              </div>
              <span className="font-semibold text-xl text-gray-900">PolarisBooking</span>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="mt-16 flex flex-col">
            <MenuItem label="Services" href={customerServicesPath()} />
            <MenuItem label="Book now" href={customerBookingPath()} />
          </nav>

          {/* Socials */}
          <div className="absolute bottom-10 w-full flex justify-center gap-6">
            {SOCIAL_ICONS.facebook('black')}
            {SOCIAL_ICONS.instagram('black')}
            {SOCIAL_ICONS.x()}
            {SOCIAL_ICONS.linkedin('black')}
            {SOCIAL_ICONS.youtube('black')}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function MenuItem({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="py-6 px-5 text-[30px] border-b-2 border-gray-800 font-medium text-right">
      {label}
    </Link>
  )
}