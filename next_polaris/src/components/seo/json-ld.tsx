import { siteConfig, sameAsLinks, absoluteUrl } from "@/lib/site-config"
import type { SerializedService } from "@/features/service/types"
import { serviceSlug } from "@/features/service/utils/slug"
import { serviceDetailPath } from "@/app/paths"

/**
 * Renders a JSON-LD <script> block. Next.js allows this in Server Components;
 * search engines and AI answer engines parse it to understand the entity.
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Schema is built from trusted server config, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * LocalBusiness / HealthAndBeautyBusiness graph for the salon.
 *
 * Note: `aggregateRating` is intentionally omitted. Google requires it to
 * reference review markup actually present on the page; adding an unbacked
 * rating risks a structured-data manual action. It will be added in Phase 2
 * once on-page reviews with `Review` markup exist.
 */
export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": ["BeautySalon", "HealthAndBeautyBusiness"],
    "@id": absoluteUrl("/#business"),
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    image: absoluteUrl(siteConfig.ogImage),
    logo: absoluteUrl("/images/polarisicon.png"),
    telephone: siteConfig.contact.phones[0],
    email: siteConfig.contact.email,
    priceRange: siteConfig.priceRange,
    currenciesAccepted: siteConfig.currency,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.address.latitude,
      longitude: siteConfig.address.longitude,
    },
    openingHoursSpecification: siteConfig.openingHours.map((spec) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: spec.days,
      opens: spec.opens,
      closes: spec.closes,
    })),
    sameAs: sameAsLinks,
  }
}

/**
 * WebSite schema with the brand name — helps engines render the site name
 * in results and associate queries with the brand.
 */
export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "en",
    publisher: { "@id": absoluteUrl("/#business") },
  }
}

/**
 * Service schema for a single treatment. `provider` links back to the
 * LocalBusiness entity via @id so engines treat them as one graph.
 */
export function buildServiceSchema(service: SerializedService): Record<string, unknown> {
  const url = absoluteUrl(serviceDetailPath(serviceSlug(service)))
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    ...(service.description ? { description: service.description } : {}),
    ...(service.imageUrl ? { image: service.imageUrl } : {}),
    ...(service.category?.name ? { serviceType: service.category.name } : {}),
    url,
    provider: { "@id": absoluteUrl("/#business") },
    areaServed: {
      "@type": "City",
      name: siteConfig.address.locality,
    },
    offers: {
      "@type": "Offer",
      price: Number(service.price).toFixed(2),
      priceCurrency: service.currency ?? siteConfig.currency,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(serviceDetailPath(serviceSlug(service))),
    },
  }
}

/**
 * BreadcrumbList for a deep page — improves how the URL trail renders in
 * search results and helps engines understand site hierarchy.
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/**
 * FAQPage schema — answer engines (AI Overviews, ChatGPT, Perplexity) readily
 * quote clean Q&A pairs, so this is a high-value GEO surface.
 */
export function buildFaqSchema(
  faqs: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}
