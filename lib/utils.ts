import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date relative to now ("3d ago", "in 2 weeks"), like the timestamps
 * on the project cards and task rows. Falls back to a short absolute date
 * beyond a year or for unparsable input.
 */
export function formatRelativeDate(input: Date | string | null | undefined): string {
  if (input === null || input === undefined) return '—';

  const date = input instanceof Date ? input : new Date(input);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  if (Number.isNaN(seconds)) return '—';

  // Under a minute there is nothing useful to relative-format.
  if (Math.abs(seconds) < 60) return 'just now';

  const abs = Math.abs(seconds);
  // Beyond a year the relative form ("1 year ago") hides the exact date, which
  // matters for project activity — switch to the absolute form instead.
  if (abs >= 365 * 24 * 3600) return formatDate(date);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (abs >= secondsInUnit) {
      // Round the absolute value: Math.round(-1.5) truncates toward zero in
      // JS, which turned "45 days ago" into "last month".
      const value = Math.sign(seconds) * Math.round(abs / secondsInUnit);
      return formatter.format(value, unit);
    }
  }
  return formatter.format(Math.round(seconds / 60), 'minute');
}

/**
 * Formats a date as a short absolute string ("Oct 17, 2026"), omitting the
 * year when it is the current year. Returns '—' for unparsable input.
 */
export function formatDate(input: Date | string | null | undefined): string {
  if (input === null || input === undefined) return '—';

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
  return new Intl.DateTimeFormat('en', options).format(date);
}
