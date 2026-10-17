import { describe, expect, it } from 'vitest';

import { resolveSentryDsn } from '@/lib/sentry-dsn';

const REAL_DSN =
  'https://b6953289261a0cf0c2636945ae132b2b@o4511387608875008.ingest.de.sentry.io/4512010803019856';

describe('resolveSentryDsn', () => {
  it('accepts a well-formed DSN', () => {
    expect(resolveSentryDsn(REAL_DSN)).toBe(REAL_DSN);
  });

  it('trims surrounding whitespace', () => {
    expect(resolveSentryDsn(`  ${REAL_DSN}  `)).toBe(REAL_DSN);
  });

  it('rejects an org token that is not a DSN', () => {
    // This exact value was previously set as SENTRY_DSN and silently disabled
    // reporting, because the SDK logs "Invalid Sentry Dsn" and stops.
    expect(resolveSentryDsn('xsmtpsib-c70ab4710-ziiRjcwfM1UwKyUM')).toBeUndefined();
  });

  it('rejects empty and whitespace values', () => {
    expect(resolveSentryDsn(undefined)).toBeUndefined();
    expect(resolveSentryDsn('')).toBeUndefined();
    expect(resolveSentryDsn('   ')).toBeUndefined();
  });

  it('rejects a URL without a public key or sentry host', () => {
    expect(resolveSentryDsn('https://example.com/123')).toBeUndefined();
    expect(resolveSentryDsn('not-a-url-at-all')).toBeUndefined();
    expect(resolveSentryDsn('ftp://key@sentry.io/1')).toBeUndefined();
  });
});
