import * as Sentry from '@sentry/nextjs';

import { resolveSentryDsn } from '@/lib/sentry-dsn';

const dsn = resolveSentryDsn(process.env.SENTRY_DSN);

if (!dsn) {
  console.warn(
    '[sentry] SENTRY_DSN missing or malformed — error reporting is disabled. ' +
      'Expected https://<key>@<org>.ingest.<region>.sentry.io/<projectId>'
  );
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // 100% tracing is expensive on a free tier. Errors are reported regardless
  // of this rate, so lowering it only reduces performance spans.
  tracesSampleRate: 0.1,
});
