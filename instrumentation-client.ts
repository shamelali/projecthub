import * as Sentry from '@sentry/nextjs';

import { resolveSentryDsn } from '@/lib/sentry-dsn';

const dsn = resolveSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
  // NEXT_PUBLIC_* so it is inlined into the browser bundle.
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
