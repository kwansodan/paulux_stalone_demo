"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { Separator } from "./ui/separator"

type ModalProps = {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  showCloseButton?: boolean
  className?:  string
  childrenClassName?:  string
  showSeparator?: boolean
}

export default function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  className,
  childrenClassName,
  showSeparator,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={cn("bg-gray-100 min-h-2xl min-w-xl p-6", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {showSeparator && (
          <Separator className="w-full"/>
        )}

        <div className={cn("overflow-y-auto ", childrenClassName)}>
        {children}
        </div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
