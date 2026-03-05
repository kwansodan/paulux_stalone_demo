"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type PolicyBottomSheetProps = {
  triggerLabel: string
  title: string
  children: React.ReactNode
  className?: string
}

export function PolicyBottomSheet({
  triggerLabel,
  title,
  children,
  className,
}: PolicyBottomSheetProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="text-left text-xs underline text-gray-500 hover:text-gray-700">
          {triggerLabel}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 h-[90%] rounded-t-3xl bg-white shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            "flex flex-col overflow-hidden",
            className
          )}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
            <Dialog.Title className="text-sm font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 text-sm text-gray-700">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

