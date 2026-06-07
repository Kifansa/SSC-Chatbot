import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],

  turbopack: {},

  // Konfigurasi webpack untuk mengatasi masalah modul binary pdf-parse
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals ?? [];
      config.externals = Array.isArray(externals)
        ? [...externals, "pdf-parse"]
        : externals;
    }
    return config;
  },
};

export default nextConfig;