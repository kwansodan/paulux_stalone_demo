import { requireRole } from "@/app/_auth/require-role"
import { UserRole } from "@generated/prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import { stylistPath, stylistHistoryPath } from "@/app/paths"
import { CalendarDays, History, Scissors } from "lucide-react"
import StylistSignOut from "@/features/staff/components/stylist-sign-out"

export const dynamic = "force-dynamic"

export default async function StylistLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([UserRole.STAFF])
  const isAdmin = (user.role as string) === "ADMIN" || (user.role as string) === "SUPER_ADMIN"
  // Only stylists (or admins previewing) may use this area.
  if (!isAdmin && !(user as any).isStylist) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-fuchsia-600" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{user.username}</span>
          </div>
          <StylistSignOut />
        </div>
        <nav className="max-w-2xl mx-auto px-4 flex gap-1 pb-1">
          <Link
            href={stylistPath()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-fuchsia-700 rounded-lg hover:bg-fuchsia-50"
          >
            <CalendarDays className="w-4 h-4" /> Today
          </Link>
          <Link
            href={stylistHistoryPath()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-fuchsia-700 rounded-lg hover:bg-fuchsia-50"
          >
            <History className="w-4 h-4" /> History
          </Link>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
