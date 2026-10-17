import * as Sentry from '@sentry/nextjs';

import { resolveSentryDsn } from '@/lib/sentry-dsn';

const dsn = resolveSentryDsn(process.env.SENTRY_DSN);

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
