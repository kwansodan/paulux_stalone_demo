/**
 * Central source of truth for public-facing business + SEO data.
 *
 * These values feed the site metadata, sitemap, robots, and JSON-LD
 * structured data. Keep them accurate — search engines and AI answer
 * engines (Google AI Overviews, ChatGPT, Perplexity, Gemini) read the
 * structured data here to describe and cite the business.
 *
 * NAP (name / address / phone) MUST stay identical to the Google Business
 * Profile and directory listings, or local ranking suffers.
 */

export const siteConfig = {
  name: "Paulux Booking",
  shortName: "Paulux",
  // Short, human description used as the default meta description.
  description:
    "Paulux Booking is an online booking platform for salons and spas. Browse services, reserve appointments and pay online.",
  tagline: "Booking made simple",
  // Canonical origin. Override per-environment with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pauluxbooking.com",
  ogImage: "/images/heroimg.jpg",
  locale: "en_GH",
  currency: "GHS",
  priceRange: "₵₵",

  // Placeholder contact details. Replace with the real ones before this is
  // used for anything other than a demo — they feed the LocalBusiness
  // structured data, so search engines will read whatever is here.
  contact: {
    email: "hello@pauluxbooking.com",
    // Primary business number first — it feeds the LocalBusiness `telephone`
    // in the structured data.
    phones: ["+233000000000"],
    whatsapp: "+233000000000",
  },

  // Placeholder address. Coordinates are central Accra, not a business pin.
  address: {
    street: "1 Demo Street",
    locality: "Accra",
    region: "Greater Accra",
    country: "GH",
    latitude: 5.6037,
    longitude: -0.187,
  },

  // Illustrative opening hours. Monday is omitted on purpose — search engines
  // read an absent day as closed.
  openingHours: [
    { days: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "20:00" },
    { days: ["Sunday"], opens: "13:00", closes: "20:00" },
  ],

  // Profiles used for the schema `sameAs` array — this is how AI/search
  // engines tie the website to the brand's other verified presences.
  // Empty until real verified profiles exist. Blank entries are filtered out
  // of `sameAs` below rather than published as broken links — a wrong sameAs
  // actively misleads search engines about who the brand is.
  socials: {
    facebook: "",
    instagram: "",
    tiktok: "",
  },

  // Primary keyword themes — used for the meta keywords hint and as a
  // reference for future per-service landing pages (Phase 2).
  keywords: [
    "unisex salon Accra",
    "beauty salon Accra",
    "spa Accra",
    "hair salon Accra",
    "nail salon Accra",
    "lash extensions Accra",
    "skincare Accra",
    "Paulux Booking",
    "beauty lounge Ghana",
  ],
} as const

export const sameAsLinks = Object.values(siteConfig.socials).filter(Boolean)

/** Absolute URL helper for canonical / OG / sitemap entries. */
export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "")
  if (!path) return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
