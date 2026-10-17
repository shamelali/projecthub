import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cn, formatDate, formatRelativeDate } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatRelativeDate', () => {
  // Pin "now" so relative formatting is deterministic.
  const now = new Date('2026-10-17T12:00:00Z');
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns just now for anything under a minute', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 30 * 1000))).toBe('just now');
    expect(formatRelativeDate(new Date(now.getTime() + 45 * 1000))).toBe('just now');
  });

  it('formats minutes, hours, days and weeks relative to now', () => {
    expect(formatRelativeDate(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5 minutes ago');
    expect(formatRelativeDate(new Date(now.getTime() - 3 * 3600 * 1000))).toBe('3 hours ago');
    expect(formatRelativeDate(daysAgo(1))).toBe('yesterday');
    expect(formatRelativeDate(daysAgo(3))).toBe('3 days ago');
    expect(formatRelativeDate(daysAgo(14))).toBe('2 weeks ago');
    expect(formatRelativeDate(daysAgo(65))).toBe('2 months ago');
  });

  it('formats future dates', () => {
    expect(formatRelativeDate(daysAgo(-2))).toBe('in 2 days');
  });

  it('switches to an absolute date beyond a year', () => {
    // "1 year ago" hides the exact date, which matters for project activity.
    expect(formatRelativeDate(daysAgo(400))).toBe(formatDate(daysAgo(400)));
  });

  it('accepts strings and returns an em dash for null, undefined or garbage', () => {
    expect(formatRelativeDate(daysAgo(2).toISOString())).toBe('2 days ago');
    expect(formatRelativeDate(null)).toBe('—');
    expect(formatRelativeDate(undefined)).toBe('—');
    expect(formatRelativeDate('not a date')).toBe('—');
  });
});

describe('formatDate', () => {
  const now = new Date('2026-10-17T12:00:00Z');
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('omits the year for dates in the current year', () => {
    // Timezone-independent: only assert the current year is absent.
    const formatted = formatDate(daysAgo(3));
    expect(formatted).not.toMatch(/2026/);
    expect(formatted).toMatch(/\d/);
  });

  it('includes the year for dates outside the current year', () => {
    expect(formatDate(daysAgo(400))).toMatch(/2025/);
  });

  it('returns an em dash for null, undefined or garbage', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
});
