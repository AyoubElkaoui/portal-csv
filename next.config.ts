import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Verhoog naar 50MB voor grote CSV files
    },
  },
};

export default nextConfig;
