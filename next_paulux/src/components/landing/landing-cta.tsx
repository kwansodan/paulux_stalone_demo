'use client'

import { customerBookingPath } from "@/app/paths"
import Link from 'next/link'

export default function LandingCTA() {
  return (
    <section className="py-16 px-5 bg-fuchsia-700">
      <div className="bg-[#8A019457] text-white rounded-3xl p-8 text-center relative overflow-hidden">
        {/* Add pointer-events-none to prevent blocking clicks */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,#fff_1px,transparent_1px)] g-size-[16px_16px] pointer-events-none" />

        {/* Add relative z-10 to content */}
        <div className="relative z-10">
          <h2 className="font-light text-[36px] leading-12 tracking-[-3%] text-center">
            Ready to transform?
          </h2>

          <p className="text-sm mt-3 max-w-xs mx-auto">
            Book your appointment today and experience the ultimate in beauty and relaxation.
          </p>

          <Link 
            href={customerBookingPath()}
            className="inline-block mt-6 rounded-full py-2.5 px-4 bg-white text-fuchsia-600 hover:bg-gray-100"
          >
            Book your experience
          </Link>
        </div>

      </div>
    </section>
  )
}