import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'polarisbeauty.biz',
      },
      {
        protocol: 'http',
        hostname: '51.255.200.48',
      }
    ],
  }
};

export default nextConfig;
