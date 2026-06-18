import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-config"
import { serviceRepository } from "@/features/service/server/service.repository"
import { serviceSlug } from "@/features/service/utils/slug"
import { serviceDetailPath } from "@/app/paths"

// Render at request time against the live database. Without this, Next
// statically generates the sitemap at build time (when the DB is unreachable),
// so the per-service URLs are silently dropped and never recover.
export const dynamic = "force-dynamic"

/**
 * Public, indexable routes. Admin (`/dashboard`, `/bookings`, …) and
 * auth/transactional routes are intentionally excluded and also blocked in
 * robots.ts. Per-service detail pages are appended dynamically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/home"), lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: absoluteUrl("/customer/services"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/customer/booking"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/gift-cards"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ]

  // Append a URL per active service. Guarded so the sitemap still serves the
  // static routes if the database is unavailable at request time.
  let serviceRoutes: MetadataRoute.Sitemap = []
  try {
    const services = await serviceRepository.getAllServices({ isActive: true })
    const seen = new Set<string>()
    serviceRoutes = services
      .map((s) => serviceSlug(s))
      .filter((slug) => slug && !seen.has(slug) && (seen.add(slug), true))
      .map((slug) => ({
        url: absoluteUrl(serviceDetailPath(slug)),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
  } catch {
    serviceRoutes = []
  }

  return [...staticRoutes, ...serviceRoutes]
}
