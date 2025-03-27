// Main instrumentation file for Next.js
// This coordinates all instrumentation across runtimes
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Important: Server/edge configuration is loaded dynamically based on runtime
  // Client instrumentation is handled by instrumentation-client.ts
  
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load server config
    try {
      await import('./sentry.server.config');
      console.log('[Sentry] Server instrumentation registered');
    } catch (e) {
      console.error('[Sentry] Error loading server configuration:', e);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Load edge config
    try {
      await import('./sentry.edge.config');
      console.log('[Sentry] Edge instrumentation registered');
    } catch (e) {
      console.error('[Sentry] Error loading edge configuration:', e);
    }
  }
  
  // Do NOT attempt to load client config here
  // That is handled by instrumentation-client.ts
}

// Expose Sentry's request error handler for API routes
export const onRequestError = Sentry.captureRequestError;
