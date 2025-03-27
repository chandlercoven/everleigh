// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b34b121ab1a1e1f19112fa1026702642@o4509049773031424.ingest.us.sentry.io/4509049774407680",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Don't use debug mode in production builds as it's not supported
  debug: process.env.NODE_ENV !== 'production'
});
