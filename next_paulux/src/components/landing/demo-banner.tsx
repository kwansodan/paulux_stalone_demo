import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { tryDemoPath } from "@/app/paths"

/**
 * Tells visitors that the salon site they're looking at is a product demo.
 *
 * Without this, a prospect sent the demo link sees what appears to be a real
 * salon's website with no indication of what it is or how to get into the
 * admin side — the part actually being sold.
 *
 * Deliberately not dismissible, and styled in the brand's own brown rather
 * than the salon theme so it reads as chrome around the demo, not as part of
 * the salon's site.
 *
 * Height is h-10 and it sticks to the top; LandingHeader sticks to top-10 so
 * the two stack instead of overlapping. Change one and change the other.
 */
export default function DemoBanner() {
  return (
    <div className="sticky top-0 z-30 h-10 bg-[#3e2017] text-[#e9e7dd]">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center gap-2 px-4 text-center">
        <p className="truncate text-xs sm:text-sm">
          <span className="hidden sm:inline">
            This is a live demo of Paulux Booking, a booking system for salons.{" "}
          </span>
          <span className="sm:hidden">Live demo of Paulux Booking. </span>
          <Link
            href={tryDemoPath()}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
          >
            Get admin access
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </div>
  )
}
