import { db } from '@/lib/db';
import { uniqueSlug } from '@/lib/slugs';

const GITHUB_API = 'https://api.github.com';

/** Authenticated GitHub REST headers shared by every request below. */
function githubHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string | null;
  updated_at: string;
  default_branch: string;
  private: boolean;
}

interface GitHubBranch {
  name: string;
  commit: { sha: string };
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { date: string };
    message: string;
  };
  author?: { login: string | null };
  parents: { sha: string }[];
  html_url: string;
  stats?: { additions: number; deletions: number; total: number };
}

/** Extract `owner`/`repo` from a GitHub repository URL. */
export function parseRepoFromUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/^https:\/\/github\.com\/([^/]+?)\/([^/]+?)\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

function parseNextPage(link?: string | null): string | null {
  if (!link) return null;
  const match = link.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

/** Fetch every repo the GitHub token can see, following pagination. */
async function fetchAllRepositories(accessToken: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let url: string | null =
    `${GITHUB_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`;

  while (url) {
    const res = await fetch(url, {
      headers: githubHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    repos.push(...((await res.json()) as GitHubRepo[]));
    url = parseNextPage(res.headers.get('link'));
  }

  return repos;
}

export interface SyncGitHubRepositoriesResult {
  imported: number;
  total: number;
  newProjectIds: string[];
}

/**
 * Import a GitHub user's repositories as ProjectHub projects.
 *
 * Idempotent: re-running updates existing projects (matched by
 * `repositoryUrl`) instead of duplicating them, so it is safe to invoke on
 * every sign-in or on demand.
 *
 * `path` is required by the schema but meaningless for a remote-only GitHub
 * project, so a synthetic unique identifier is stored there and the real
 * remote URL lives in `repositoryUrl`.
 */
export async function syncGitHubRepositories(params: {
  userId: string;
  accessToken: string;
}): Promise<SyncGitHubRepositoriesResult> {
  const { userId, accessToken } = params;
  const repos = await fetchAllRepositories(accessToken);

  let imported = 0;
  const newProjectIds: string[] = [];
  for (const repo of repos) {
    const slug = await uniqueSlug(repo.full_name);
    const path = `github:${userId}/${repo.full_name}`;
    const data = {
      name: repo.name,
      slug,
      description: repo.description ?? null,
      path,
      repositoryUrl: repo.html_url,
      techStack: repo.language ? [repo.language] : [],
      lastActivityAt: new Date(repo.pushed_at ?? repo.updated_at),
    };

    const existing = await db.project.findFirst({
      where: { ownerId: userId, repositoryUrl: repo.html_url },
    });

    if (existing) {
      await db.project.update({ where: { id: existing.id }, data });
    } else {
      const project = await db.project.create({
        data: { ...data, ownerId: userId },
        select: { id: true },
      });
      newProjectIds.push(project.id);
    }
    imported += 1;
  }

  return { imported, total: repos.length, newProjectIds };
}

/**
 * Fetches a repository's `pushed_at` timestamp — the true last-activity date,
 * because it covers pushes to *any* branch, while the commits endpoint only
 * sees the default branch. Returns null for GitLab URLs, unknown repos, or
 * network/auth failures (callers treat null as "no update").
 */
export async function fetchRepoPushedAt(
  accessToken: string,
  repositoryUrl: string
): Promise<Date | null> {
  const parsed = parseRepoFromUrl(repositoryUrl);
  if (!parsed) return null;

  try {
    const res = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`, {
      headers: githubHeaders(accessToken),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const repo = (await res.json()) as { pushed_at?: string };
    if (!repo.pushed_at) return null;
    const date = new Date(repo.pushed_at);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/** Fetch every branch for a repository. */
async function fetchBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches?per_page=100`, {
    headers: githubHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return (await res.json()) as GitHubBranch[];
}

/** Fetch recent commits for a repository (default branch unless `ref` is given). */
async function fetchCommits(
  accessToken: string,
  owner: string,
  repo: string,
  ref?: string | null
): Promise<GitHubCommit[]> {
  const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/commits`);
  url.searchParams.set('per_page', '50');
  if (ref) url.searchParams.set('sha', ref);

  const res = await fetch(url.toString(), {
    headers: githubHeaders(accessToken),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return (await res.json()) as GitHubCommit[];
}

export interface SyncProjectGitDataResult {
  branches: number;
  commits: number;
}

/**
 * Sync branches and recent commits for a single GitHub-backed project.
 *
 * Best-effort: every failure is swallowed so the caller is never blocked by
 * GitHub rate limits or a missing token.
 */
export async function syncProjectGitData(params: {
  projectId: string;
  userId: string;
  accessToken: string;
}): Promise<SyncProjectGitDataResult> {
  const { projectId, userId, accessToken } = params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { repositoryUrl: true, ownerId: true },
  });
  if (!project || project.ownerId !== userId) {
    return { branches: 0, commits: 0 };
  }

  const parsed = parseRepoFromUrl(project.repositoryUrl ?? '');
  if (!parsed) return { branches: 0, commits: 0 };

  const { owner, repo } = parsed;

  // Record the origin remote.
  await db.gitRemote.upsert({
    where: { projectId_name: { projectId, name: 'origin' } },
    update: { url: project.repositoryUrl ?? '' },
    create: { projectId, name: 'origin', url: project.repositoryUrl ?? '' },
  });

  const [branches, defaultCommits] = await Promise.all([
    fetchBranches(accessToken, owner, repo),
    fetchCommits(accessToken, owner, repo),
  ]);

  let commitCount = 0;
  for (const commit of defaultCommits) {
    const author = commit.commit.author;
    // The commits summary endpoint already returns the fields we persist, so
    // one payload object feeds both the upsert's create and update halves.
    const commitData = {
      message: commit.commit.message,
      authorName: author.name,
      authorEmail: author.email,
      authorDate: new Date(author.date),
      committerDate: new Date(commit.commit.committer.date),
      url: commit.html_url,
      branchName: 'default',
      isMerge: commit.parents.length > 1,
      parents: commit.parents.map((p) => p.sha),
      ...(commit.stats
        ? {
            stats: {
              additions: commit.stats.additions,
              deletions: commit.stats.deletions,
              files: 0,
            },
          }
        : {}),
    };
    await db.gitCommit.upsert({
      where: { projectId_sha: { projectId, sha: commit.sha } },
      update: commitData,
      create: { projectId, sha: commit.sha, shortSha: commit.sha.slice(0, 7), ...commitData },
    });
    commitCount += 1;
  }

  const defaultBranchName = 'default';
  let branchCount = 0;
  for (const branch of branches) {
    const branchData = {
      lastCommitSha: branch.commit.sha,
      isDefault: branch.name === defaultBranchName,
    };
    await db.gitBranch.upsert({
      where: { projectId_name: { projectId, name: branch.name } },
      update: branchData,
      create: { projectId, name: branch.name, ...branchData },
    });
    branchCount += 1;
  }

  return { branches: branchCount, commits: commitCount };
}
