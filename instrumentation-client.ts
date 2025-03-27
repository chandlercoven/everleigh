// Modern Next.js instrumentation file for client Sentry initialization
// This file is used by Next.js 13.4+ for client-side instrumentation
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry on the client side
if (typeof window !== 'undefined') {
  Sentry.init({
    dsn: "https://b34b121ab1a1e1f19112fa1026702642@o4509049773031424.ingest.us.sentry.io/4509049774407680",

    // Add exactly one integration for replay
    integrations: [
      Sentry.replayIntegration(),
    ],

    // Define how likely traces are sampled
    tracesSampleRate: 1.0,

    // Define how likely Replay events are sampled
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Don't use debug mode in production builds as it's not supported
    debug: process.env.NODE_ENV !== 'production'
  });
} 