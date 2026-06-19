import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
  // The Docker build caps Node's heap at 2GB (Dockerfile.prod NODE_OPTIONS).
  // `next build`'s in-process type-check was OOM-ing the build. We already
  // validate types out-of-band (`npm run type`), so skip the redundant in-build
  // pass to keep peak memory under the cap. Keep running `npm run type` in CI.
  typescript: {
    ignoreBuildErrors: true,
  },
  // The homepage now lives at `/`. Permanently redirect the old `/home` URL so
  // existing links, bookmarks and any directory/GBP entries keep working and
  // their ranking signals consolidate onto the root.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
    ]
  },
  images: {
    // Image optimization enabled for better LCP / Core Web Vitals.
    // Requires the Next image optimizer (sharp) at runtime — verify images
    // still render in the production/standalone deploy after this change.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polarisbeautylounge.com',
        pathname: '/files/**',
      }
    ],
  }
};

export default nextConfig;
