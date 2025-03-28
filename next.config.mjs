import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Configure for production API routes
  output: 'standalone',
  // Disable TypeScript errors in production builds
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint errors in production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  // Only use instrumentation hook system
  autoInstrumentServerFunctions: false,
  autoInstrumentClient: false,
  autoInstrumentMiddleware: false,
  enableInstrumentationHook: true
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions);
