import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: resolve(import.meta.dirname, "../.."),
  },
};

export default nextConfig;
