import { describe, expect, it } from 'vitest';

import { isPathWithinConfiguredPath } from '@/lib/path-security';

describe('isPathWithinConfiguredPath', () => {
  it('allows the configured directory and its descendants', () => {
    expect(isPathWithinConfiguredPath('/home/user/projects', ['/home/user/projects'])).toBe(true);
    expect(isPathWithinConfiguredPath('/home/user/projects/app', ['/home/user/projects'])).toBe(
      true
    );
  });

  it('rejects sibling paths and traversal outside the configured directory', () => {
    expect(isPathWithinConfiguredPath('/home/user/projects-other', ['/home/user/projects'])).toBe(
      false
    );
    expect(
      isPathWithinConfiguredPath('/home/user/projects/../secrets', ['/home/user/projects'])
    ).toBe(false);
  });
});
