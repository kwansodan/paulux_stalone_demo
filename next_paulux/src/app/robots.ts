import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/site-config"

/**
 * Allow crawling of public marketing pages; keep admin, auth, customer
 * account, and transactional routes out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/bookings",
          "/payments",
          "/products",
          "/materials",
          "/reports",
          // NOTE: `/services` (admin list) is deliberately NOT disallowed here
          // because public service detail pages live at `/services/<slug>`.
          // The admin list itself is auth-gated and marked noindex per-page.
          "/app-settings",
          "/promo-codes",
          "/gift-cards/success",
          "/gift-card-orders",
          "/customer/booking/summary",
          "/customer/booking/reschedule",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/unauthorized",
          "/api",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  }
}
