import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Must be NEXT_PUBLIC_* so it is inlined into the browser bundle.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // 100% tracing is expensive on a free tier.
  tracesSampleRate: 0.1,
});
