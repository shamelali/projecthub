import { describe, expect, it } from 'vitest';

import { buildLocalImports, extractOriginUrl, sanitizeRelativePath } from '@/lib/local-import';

const T = 1_700_000_000_000;

describe('buildLocalImports', () => {
  it('finds one import per top-level git repository', () => {
    const items = buildLocalImports([
      { path: 'projects/my-app/.git/config', lastModified: T },
      { path: 'projects/my-app/src/index.ts', lastModified: T + 5 },
      { path: 'projects/my-app/package.json', lastModified: T + 2 },
      { path: 'projects/notes/readme.md', lastModified: T },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      name: 'my-app',
      relativePath: 'my-app',
      configPath: 'projects/my-app/.git/config',
      lastActivityAt: new Date(T + 5).toISOString(),
    });
  });

  it('treats the picked folder as the only import when it is itself a repo', () => {
    const items = buildLocalImports([
      { path: 'my-app/.git/config', lastModified: T },
      { path: 'my-app/src/index.ts', lastModified: T + 1 },
      { path: 'my-app/notes.txt', lastModified: T },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'my-app', relativePath: '' });
  });

  it('skips directories without .git and ignores stray root files', () => {
    const items = buildLocalImports([
      { path: 'projects/readme.md', lastModified: T },
      { path: 'projects/app/main.py', lastModified: T },
    ]);
    expect(items).toHaveLength(0);
  });

  it('drops directories whose names are pure traversal', () => {
    // `..` as a directory name is path traversal — it must not become a
    // project (empty after sanitization), not even with a .git dir inside.
    const items = buildLocalImports([{ path: 'projects/../../etc/.git/config', lastModified: T }]);
    expect(items).toHaveLength(0);
  });

  it('caps the import at MAX_IMPORT_ITEMS', async () => {
    const { MAX_IMPORT_ITEMS } = await import('@/lib/local-import');
    const files = Array.from({ length: MAX_IMPORT_ITEMS + 50 }, (_, i) => ({
      path: `projects/repo-${i}/.git/config`,
      lastModified: T,
    }));
    const items = buildLocalImports(files);
    expect(items).toHaveLength(MAX_IMPORT_ITEMS);
  });
});

describe('extractOriginUrl', () => {
  it('reads the origin URL from a standard .git/config', () => {
    const config = `[core]
	repositoryformatversion = 0
[remote "origin"]
	url = https://github.com/shamelali/projecthub.git
	fetch = +refs/heads/*:refs/remotes/origin/*
`;
    expect(extractOriginUrl(config)).toBe('https://github.com/shamelali/projecthub.git');
  });

  it('accepts ssh remotes', () => {
    const config = '[remote "origin"]\n\turl = git@gitlab.com:group/repo.git\n';
    expect(extractOriginUrl(config)).toBe('git@gitlab.com:group/repo.git');
  });

  it('returns null for missing origin or non-URL remotes', () => {
    expect(extractOriginUrl('[core]\n\tbare = true\n')).toBeNull();
    expect(extractOriginUrl('[remote "origin"]\n\turl = /mnt/disk/repo\n')).toBeNull();
    expect(extractOriginUrl('')).toBeNull();
  });
});

describe('sanitizeRelativePath', () => {
  it('keeps clean segments and limits depth', () => {
    expect(sanitizeRelativePath('work/my-app')).toBe('work/my-app');
    expect(sanitizeRelativePath('a/b/c/d/e/f/g/h')).toBe('a/b/c/d/e/f');
  });

  it('strips traversal and empty segments', () => {
    expect(sanitizeRelativePath('../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeRelativePath('//')).toBe('');
    expect(sanitizeRelativePath('a/../../b')).toBe('a/b');
  });
});
