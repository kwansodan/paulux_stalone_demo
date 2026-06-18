import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Timer } from "lucide-react"

import { serviceRepository } from "@/features/service/server/service.repository"
import { findServiceBySlug, serviceSlug } from "@/features/service/utils/slug"
import { formatDuration } from "@/features/service/utils/helpers"
import { customerBookingPath, customerServicesPath, serviceDetailPath } from "@/app/paths"
import {
  JsonLd,
  buildServiceSchema,
  buildBreadcrumbSchema,
} from "@/components/seo/json-ld"
import { siteConfig, absoluteUrl } from "@/lib/site-config"

// ISR: cache the page, refresh hourly. Faster crawls + good Core Web Vitals.
export const revalidate = 3600

/**
 * Single request-scoped fetch of active services, shared by generateMetadata
 * and the page body via React's cache() so we don't query twice per request.
 */
const getActiveServices = cache(async () =>
  serviceRepository.getAllServices({ isActive: true }),
)

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const services = await getActiveServices()
  const service = findServiceBySlug(services, slug)

  if (!service) {
    return { title: "Service not found", robots: { index: false, follow: false } }
  }

  const title = `${service.name} in ${siteConfig.address.locality}`
  const description = service.description
    ? service.description.slice(0, 160)
    : `Book ${service.name} at ${siteConfig.name} in ${siteConfig.address.locality}, ${siteConfig.currency} ${Number(service.price).toFixed(2)}. ${siteConfig.tagline}.`
  const url = serviceDetailPath(slug)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(url),
      images: service.imageUrl ? [{ url: service.imageUrl }] : [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: service.imageUrl ? [service.imageUrl] : [siteConfig.ogImage],
    },
  }
}

export default async function ServiceDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const services = await getActiveServices()
  const service = findServiceBySlug(services, slug)

  if (!service) notFound()

  const hasDeposit = Number(service.minDepositFixed) > 0
  const related = services
    .filter((s) => s.id !== service.id && s.category?.id && s.category.id === service.category?.id)
    .slice(0, 4)

  return (
    <article className="px-4 py-8 max-w-2xl mx-auto w-full">
      <JsonLd schema={buildServiceSchema(service)} />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name: "Home", path: "/home" },
          { name: "Services", path: customerServicesPath() },
          { name: service.name, path: serviceDetailPath(slug) },
        ])}
      />

      {/* Breadcrumb (visible) */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-6">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/home" className="hover:text-gray-900">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={customerServicesPath()} className="hover:text-gray-900">Services</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-900 font-medium truncate">{service.name}</li>
        </ol>
      </nav>

      {service.imageUrl && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {service.category?.name && (
        <span className="inline-block text-[11px] font-semibold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2.5 py-0.5 rounded-full mb-3">
          {service.category.name}
        </span>
      )}

      <h1 className="font-family-seasons text-4xl leading-tight mb-3">{service.name}</h1>

      <div className="flex items-center gap-3 text-sm text-gray-700 mb-6">
        <span className="inline-flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-gray-400" />
          {formatDuration(service.durationMinutes)}
        </span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-gray-900">
          {siteConfig.currency} {Number(service.price).toFixed(2)}
        </span>
        {hasDeposit && (
          <span className="text-[11px] font-medium text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2 py-0.5 rounded-full">
            {siteConfig.currency} {Number(service.minDepositFixed).toFixed(2)} deposit
          </span>
        )}
      </div>

      {service.description ? (
        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
          {service.description}
        </p>
      ) : (
        <p className="text-gray-500 leading-relaxed mb-8">
          Book {service.name} at {siteConfig.name} in {siteConfig.address.locality}.
        </p>
      )}

      <Link
        href={customerBookingPath(service.id)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-medium rounded-full transition-colors"
      >
        Book this treatment
        <ArrowRight className="h-4 w-4" />
      </Link>

      {related.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Related treatments
          </h2>
          <ul className="space-y-1">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={serviceDetailPath(serviceSlug(r))}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 -mx-2 px-2 rounded"
                >
                  <span className="text-sm font-medium text-gray-900">{r.name}</span>
                  <span className="text-xs text-gray-500">
                    {siteConfig.currency} {Number(r.price).toFixed(2)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
