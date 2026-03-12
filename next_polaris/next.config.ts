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
        pathname: '/files/**',
      }
    ],
  }
};

export default nextConfig;
