import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: false,
  images: {
    unoptimized: true,
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
