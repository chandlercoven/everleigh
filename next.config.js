/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Configure for production API routes
  output: 'standalone',
  experimental: {
    appDocumentPreloading: false,
  },
  // Add these to prevent redirect loops
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  }
}

export default nextConfig 