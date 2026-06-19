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
  name: "Polaris Beauty Lounge",
  shortName: "Polaris",
  // Short, human description used as the default meta description.
  description:
    "Polaris Beauty Lounge is a premium unisex salon in Accra, Ghana. Book hair, nails, skincare, lashes and spa treatments online.",
  tagline: "Where Beauty Meets Serenity",
  // Canonical origin. Override per-environment with NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://polarisbeautylounge.com",
  ogImage: "/images/heroimg.jpg",
  locale: "en_GH",
  currency: "GHS",
  priceRange: "₵₵",

  contact: {
    email: "polarisbeautylounge@gmail.com",
    // Primary business number first — it feeds the LocalBusiness `telephone`
    // in the structured data. Keep this consistent with the footer and Google
    // Business Profile (NAP consistency).
    phones: ["+233504851482", "+233240702107"],
    whatsapp: "+233504851482",
  },

  address: {
    street: "12 Brenya Ave",
    locality: "Accra",
    region: "Greater Accra",
    country: "GH",
    // Coordinates from the business Google Maps place pin.
    latitude: 5.610236,
    longitude: -0.2312859,
  },

  // Real opening hours (confirmed by client 2026-06-19). Monday is closed and
  // intentionally omitted — search engines read an absent day as closed.
  openingHours: [
    { days: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "20:00" },
    { days: ["Sunday"], opens: "13:00", closes: "20:00" },
  ],

  // Profiles used for the schema `sameAs` array — this is how AI/search
  // engines tie the website to the brand's other verified presences.
  socials: {
    facebook: "https://www.facebook.com/share/17zoSqtEfT/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/polarisbeautylounge",
    tiktok: "https://www.tiktok.com/@polarisbeautylounge",
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
    "Polaris Beauty Lounge",
    "beauty lounge Ghana",
  ],
} as const

export const sameAsLinks = Object.values(siteConfig.socials)

/** Absolute URL helper for canonical / OG / sitemap entries. */
export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "")
  if (!path) return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
