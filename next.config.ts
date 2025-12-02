import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Verhoog body size limit voor file uploads (max 50MB voor Vercel Hobby)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
