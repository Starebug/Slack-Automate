import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'agenda'],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('mongodb');
    return config;
  },
};

export default nextConfig;
