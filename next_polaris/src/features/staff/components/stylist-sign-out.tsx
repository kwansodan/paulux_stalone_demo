"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { signInPath } from "@/app/paths"

export default function StylistSignOut() {
  const router = useRouter()

  async function handleSignOut() {
    try {
      await api.get("/logout")
    } catch {
      // best-effort; still send them to login
    }
    router.push(signInPath())
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500"
    >
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  )
}
