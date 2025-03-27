import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Configure for production API routes
  output: 'standalone',
  experimental: {
    // Disable document preloading as recommended
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

// Configure Sentry source maps and error reporting
const sentryWebpackPluginOptions = {
  org: "bundle-coverage-llc",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring/sentry",
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Configure Sentry SDK initialization
const sentryOptions = {
  // Important: We'll use the new instrumentation hook system
  // Disable any automatic SDK initialization from the plugin
  autoInstrumentServerFunctions: false,
  autoInstrumentClient: false,
  autoInstrumentMiddleware: false,
  
  // Use only instrumentation files for initialization
  enableInstrumentationHook: true
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions);
