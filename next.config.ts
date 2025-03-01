// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Allows production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'avatars.mds.yandex.net',
      'firebasestorage.googleapis.com',
      'encrypted-tbn0.gstatic.com',
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
    ],
  },
  webpack: (config, { isServer }) => {
    // Only apply the fallback for client-side bundles.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };
    }
    return config;
  },
};

export default nextConfig;
