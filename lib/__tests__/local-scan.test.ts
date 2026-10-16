import { afterEach, describe, expect, it } from 'vitest';

import { isLocalScanEnabled } from '@/lib/local-scan';

describe('isLocalScanEnabled', () => {
  const original = process.env.ENABLE_LOCAL_SCAN;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ENABLE_LOCAL_SCAN;
    } else {
      process.env.ENABLE_LOCAL_SCAN = original;
    }
  });

  it('is disabled when the variable is unset', () => {
    delete process.env.ENABLE_LOCAL_SCAN;
    expect(isLocalScanEnabled()).toBe(false);
  });

  it('is enabled only for the exact string "true"', () => {
    process.env.ENABLE_LOCAL_SCAN = 'true';
    expect(isLocalScanEnabled()).toBe(true);
  });

  it('is disabled for any other truthy-looking value', () => {
    // Vercel exposes env vars as strings; "1" and "TRUE" must not enable the
    // scanner, otherwise a sloppy value silently exposes a dead route.
    process.env.ENABLE_LOCAL_SCAN = '1';
    expect(isLocalScanEnabled()).toBe(false);

    process.env.ENABLE_LOCAL_SCAN = 'TRUE';
    expect(isLocalScanEnabled()).toBe(false);

    process.env.ENABLE_LOCAL_SCAN = '';
    expect(isLocalScanEnabled()).toBe(false);
  });
});
