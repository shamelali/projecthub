/**
 * Browser-side "Import from local" parsing.
 *
 * The server (Vercel / Cloudflare Workers) has no filesystem, so the scan
 * happens entirely in the browser: the user picks a folder via a
 * `webkitdirectory` input, this module reduces the file listing to one entry
 * per git repository at the top level, and only metadata — name, origin URL
 * parsed from `.git/config`, latest file mtime — is sent to the server.
 * No file contents leave the browser except the ~1KB `.git/config` text.
 */

export interface LocalFileEntry {
  /** `webkitRelativePath`, e.g. `projects/my-app/src/index.ts` */
  path: string;
  lastModified: number;
}

export interface LocalImportItem {
  /** Top-level directory name under the selected folder. */
  name: string;
  /**
   * Sanitized directory path relative to the picked folder ('' when the user
   * picked a repository folder itself). The server prefixes it into a
   * synthetic `local:<userId>/<path>` project path.
   */
  relativePath: string;
  /** Path of the `.git/config` entry in the original file listing. */
  configPath: string | null;
  /** Newest file mtime inside the directory, ISO string (activity proxy). */
  lastActivityAt: string | null;
}

/** Safety caps — a projects root should never approach these. */
export const MAX_IMPORT_ITEMS = 200;
export const MAX_FILES = 50_000;

/** True when `path` refers to a file inside a `.git` metadata directory. */
function isInDotGit(path: string): boolean {
  return /(^|\/)\.git\//.test(path);
}

function sanitizeSegment(segment: string): string {
  const cleaned = segment
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  // Dots are legal in directory names (my.app) but `.`/`..` are traversal —
  // drop them outright.
  return /^\.\.?$/.test(cleaned) ? '' : cleaned;
}

/** Sanitize a relative path into safe segments for the synthetic path. */
export function sanitizeRelativePath(path: string): string {
  return path.split('/').map(sanitizeSegment).filter(Boolean).slice(0, 6).join('/');
}

/**
 * Reduces a browser file listing to importable project metadata.
 *
 * Only top-level directories of the picked folder are considered (matching
 * the old server-side scanner), and only those containing a `.git` directory
 * count as projects. Picking a repository folder itself imports just that
 * repository. Results are capped at MAX_IMPORT_ITEMS.
 */
export function buildLocalImports(
  files: Array<{ path: string; lastModified: number }>
): LocalImportItem[] {
  const rootName = files[0]?.path.split('/')[0] ?? '';
  // dirs maps a candidate project directory to its listing stats. The key is
  // the path relative to the picked folder ('' meaning the folder itself).
  const dirs = new Map<string, { lastModified: number; configPath: string | null }>();

  for (const file of files.slice(0, MAX_FILES)) {
    const segments = file.path.split('/').filter(Boolean);
    if (segments.length < 2) continue;

    // `root/<repo>/...` → project dir `<repo>`; `root/.git/...` → the picked
    // folder itself is the repository.
    const dirKey = segments[1] === '.git' ? '' : segments[1];
    const entry = dirs.get(dirKey) ?? { lastModified: 0, configPath: null };
    if (file.lastModified > entry.lastModified) entry.lastModified = file.lastModified;
    if (isInDotGit(file.path) && segments[segments.length - 1] === 'config') {
      entry.configPath = file.path;
    }
    dirs.set(dirKey, entry);
  }

  const items: LocalImportItem[] = [];
  for (const [dirKey, info] of dirs) {
    // Directories without `.git/config` are not repositories — skip them.
    if (!info.configPath) continue;
    const name = sanitizeSegment(dirKey === '' ? rootName : dirKey);
    if (!name) continue;
    items.push({
      name,
      relativePath: sanitizeRelativePath(dirKey),
      configPath: info.configPath,
      lastActivityAt: info.lastModified ? new Date(info.lastModified).toISOString() : null,
    });
    if (items.length >= MAX_IMPORT_ITEMS) break;
  }

  // If the picked folder is itself a repository, it is the only import.
  const rootRepo = items.find((item) => item.relativePath === '');
  return rootRepo ? [rootRepo] : items;
}

/** Extracts the origin remote URL from a `.git/config` file's text. */
export function extractOriginUrl(config: string): string | null {
  const match = config.match(/\[remote "origin"\][^[]*?url\s*=\s*(\S+)/);
  if (!match) return null;
  const url = match[1].trim();
  // Only http(s) and ssh forms are meaningful as project.repositoryUrl.
  return /^(https?:\/\/|git@)/.test(url) ? url : null;
}
