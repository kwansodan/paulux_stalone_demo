"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { SerializedService } from "../../../features/service/types"
import { SerializedPackage } from "../../../features/package/types"
import ServiceCard from "./service-card"
import SearchBar from "./SearchBar"
import { customerBookingPath } from "@/app/paths"
import { ArrowRight, Package, Timer } from "lucide-react"

export default function ServicesGrid({
  services,
  packages = [],
}: {
  services: SerializedService[]
  packages?: SerializedPackage[]
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Derive unique categories from services, preserving insertion order
  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    services.forEach((s) => {
      if (s.category && !seen.has(s.category.id)) {
        seen.set(s.category.id, s.category.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [services])

  const filteredServices = useMemo(() => {
    let result = services
    if (activeCategory) result = result.filter((s) => s.category?.id === activeCategory)
    if (searchTerm) result = result.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    return result
  }, [searchTerm, activeCategory, services])

  const filteredPackages = useMemo(() =>
    packages.filter((pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    ),
    [searchTerm, packages]
  )

  if (!services.length && !packages.length) {
    return (
      <div className="py-20 text-center text-gray-500">
        No services available at the moment
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* ── Category tabs ── */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Packages section (only shown on "All" tab) ── */}
      {!activeCategory && filteredPackages.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-fuchsia-600" />
            <h2 className="text-lg font-semibold text-gray-900">Packages</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => {
              const individualTotal = pkg.services.reduce(
                (sum, ps) => sum + Number(ps.service.price),
                0
              )
              const savings = individualTotal - Number(pkg.price)
              const totalMins = pkg.services.reduce(
                (sum, ps) => sum + ps.service.durationMinutes,
                0
              )

              return (
                <div
                  key={pkg.id}
                  className="relative w-full rounded-3xl overflow-hidden shadow-lg group bg-white border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative w-full h-52 overflow-hidden">
                    {pkg.imageUrl ? (
                      <Image
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-fuchsia-100 to-pink-100 flex items-center justify-center">
                        <Package className="w-16 h-16 text-fuchsia-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Duration badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className="flex items-center justify-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
                        <Timer className="inline-block h-4 w-4 mr-1" />
                        {totalMins} min
                      </span>
                    </div>

                    {/* Savings badge */}
                    {savings > 0 && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Save ₵{savings.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                      )}
                    </div>

                    {/* Service pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.services.map((ps) => (
                        <span
                          key={ps.serviceId}
                          className="text-[11px] bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 px-2 py-0.5 rounded-full"
                        >
                          {ps.service.name}
                        </span>
                      ))}
                    </div>

                    {/* Price + Book */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="font-bold text-fuchsia-600 text-lg">
                          GHS {Number(pkg.price).toFixed(2)}
                        </p>
                        {savings > 0 && (
                          <p className="text-xs text-gray-400 line-through">
                            GHS {individualTotal.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={customerBookingPath(undefined, pkg.id)}
                        className="py-2.5 px-4 bg-fuchsia-600 flex gap-2 items-center justify-center hover:bg-fuchsia-700 rounded-full transition-colors text-white text-sm"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span>Book Now</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Divider between packages and services (All tab only) ── */}
      {!activeCategory && filteredPackages.length > 0 && filteredServices.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-400 font-medium">Individual Services</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* ── Services grid ── */}
      {filteredServices.length === 0 && (!activeCategory ? filteredPackages.length === 0 : true) ? (
        <div className="py-20 text-center text-gray-500">
          {searchTerm ? "No services match your search" : "No services available in this category"}
        </div>
      ) : filteredServices.length > 0 ? (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
