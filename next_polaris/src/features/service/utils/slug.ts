import type { SerializedService } from "../types"

/**
 * Derive a stable, URL-safe slug from a service name.
 *
 * Slugs are computed from the name (no DB column yet) so public service URLs
 * read like `/services/gel-manicure`. If two active services share a name the
 * first match wins; disambiguate by renaming, or persist a `slug` column later.
 *
 * NFKD normalization splits accented characters into base + combining marks;
 * the `[^a-z0-9]+` filter then drops the marks, so accents become plain ASCII.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics (incl. accents) -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-") // collapse repeats
}

export function serviceSlug(service: Pick<SerializedService, "name">): string {
  return slugify(service.name)
}

/** Find the active service whose name slugifies to the given slug. */
export function findServiceBySlug<T extends Pick<SerializedService, "name">>(
  services: T[],
  slug: string,
): T | undefined {
  return services.find((s) => slugify(s.name) === slug)
}
