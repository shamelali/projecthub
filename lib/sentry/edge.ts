import * as Sentry from '@sentry/nextjs';

import { resolveSentryDsn } from '@/lib/sentry-dsn';

export function initEdge() {
  Sentry.init({
    dsn: resolveSentryDsn(process.env.SENTRY_DSN),
    enabled: Boolean(resolveSentryDsn(process.env.SENTRY_DSN)),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
