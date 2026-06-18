import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
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
