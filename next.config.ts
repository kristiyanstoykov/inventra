import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mysql2'],
  experimental: { serverComponentsExternalPackages: ['pdfkit', 'sharp'] },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-side dependencies from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        tls: false,
        net: false,
        dns: false,
        fs: false,
        request: false,
        mysql2: false,
      };
    }
    return config;
  },
};

export default nextConfig;
