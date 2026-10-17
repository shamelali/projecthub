import { describe, expect, it } from 'vitest';

import { themeScript, themeToHtmlClass } from '@/lib/theme';

describe('themeToHtmlClass', () => {
  it('renders LIGHT without the dark class', () => {
    expect(themeToHtmlClass('LIGHT')).toBe('');
  });

  it('renders DARK and SYSTEM dark (SYSTEM is corrected client-side)', () => {
    expect(themeToHtmlClass('DARK')).toBe('dark');
    expect(themeToHtmlClass('SYSTEM')).toBe('dark');
  });

  it('defaults to dark for missing or unknown values', () => {
    expect(themeToHtmlClass(null)).toBe('dark');
    expect(themeToHtmlClass(undefined)).toBe('dark');
    expect(themeToHtmlClass('SOMETHING_ELSE')).toBe('dark');
  });
});

describe('themeScript', () => {
  it('emits an inline script only for SYSTEM', () => {
    expect(themeScript('SYSTEM')).toContain('matchMedia');
    expect(themeScript('DARK')).toBe('');
    expect(themeScript('LIGHT')).toBe('');
  });

  it('follows the OS preference live via a change listener', () => {
    expect(themeScript('SYSTEM')).toContain("addEventListener('change'");
  });
});
