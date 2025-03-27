import * as Sentry from '@sentry/nextjs';
import { browserTracingIntegration, replayIntegration } from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    browserTracingIntegration({
      tracePropagationTargets: ['localhost', /^https:\/\/everleigh\.ai/],
    }),
    replayIntegration(),
  ],
}); 