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
}

export default nextConfig 