"use client"

import { X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { SOCIAL_ICONS } from "../landing/landing-footer"
import "./mobile-menu.css"
import Link from "next/link"
import { customerBookingPath, customerServicesPath, giftCardsPath, homePath } from "@/app/paths"
import Image from 'next/image'

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
          {/* <VisuallyHidden> */}
            <Dialog.Title className="hidden">Mobile Menu</Dialog.Title>
          {/* </VisuallyHidden> */}
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6">
            <Link href={homePath()} className="flex items-center gap-2">
              <Image
                src="/images/polarisicon.png"
                alt="Company Logo"
                width={100}
                height={50}
                priority
              />
            </Link>

            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="mt-16 flex flex-col">
            <MenuItem label="Services" href={customerServicesPath()} onClose={() => onOpenChange(false)} />
            <MenuItem label="Book now" href={customerBookingPath()} onClose={() => onOpenChange(false)}/>
            <MenuItem label="Gift cards" href={giftCardsPath()} onClose={() => onOpenChange(false)}/>
          </nav>

          {/* Socials */}
          <div className="absolute bottom-10 w-full flex justify-center gap-6">
            <Link href="https://www.facebook.com/share/17zoSqtEfT/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.facebook('black')}
            </Link>
            <Link href="https://www.instagram.com/polarisbeautylounge?igsh=MWJ4dzk2bDY5YmFrcQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.instagram('black')}
            </Link>
            <Link href="https://www.tiktok.com/@polarisbeautylounge?_r=1&_t=ZS-93mfvZstJqL" target="_blank" rel="noopener noreferrer" className="text-white/70 flex gap-2 items-center hover:text-white transition-colors">
              {SOCIAL_ICONS.tiktok('black')}
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function MenuItem({ label, href, onClose }: { label: string; href: string; onClose?: () => void }) {
  return (
    <Link href={href}  onClick={onClose} className="py-6 px-5 text-[30px] border-b-2 border-gray-800 font-medium text-right">
      {label}
    </Link>
  )
}