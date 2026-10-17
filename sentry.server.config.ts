import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // 100% tracing is expensive on a free tier. Errors are always reported;
  // performance spans are sampled.
  tracesSampleRate: 0.1,
  // Do not send PII to Sentry by default.
});
