import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // This allows production builds to successfully complete even if
    // THE project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'avatars.mds.yandex.net',
      'firebasestorage.googleapis.com',
      'encrypted-tbn0.gstatic.com',
    ], // Added Firebase Storage domain
  },
}

export default nextConfig
