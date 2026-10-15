import { simpleGit } from "simple-git";
import { readdirSync } from "fs";
import { join } from "path";

export interface ScannedProject {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch?: string;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  remotes?: string[];
}

export async function scanDirectoryForProjects(
  basePath: string
): Promise<ScannedProject[]> {
  const results: ScannedProject[] = [];

  try {
    const entries = readdirSync(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = join(basePath, entry.name);
      const isGitRepo = await isGitRepository(fullPath);

      if (isGitRepo) {
        const gitInfo = await getGitInfo(fullPath);
        results.push({
          name: entry.name,
          path: fullPath,
          isGitRepo: true,
          ...gitInfo,
        });
      }
    }
  } catch {
    // Directory doesn't exist or isn't accessible
  }

  return results;
}

async function isGitRepository(path: string): Promise<boolean> {
  try {
    const git = simpleGit(path);
    await git.revparse(["--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

async function getGitInfo(
  path: string
): Promise<{ branch?: string; lastCommit?: ScannedProject["lastCommit"]; remotes?: string[] }> {
  try {
    const git = simpleGit(path);

    const [branch, log, remotes] = await Promise.all([
      git.branch(),
      git.log({ maxCount: 1 }),
      git.getRemotes(),
    ]);

    return {
      branch: branch.current,
      lastCommit: log.latest
        ? {
            hash: log.latest.hash,
            message: log.latest.message,
            author: log.latest.author_name,
            date: log.latest.date,
          }
        : undefined,
      remotes: remotes.map((r) => (r as unknown as Record<string, unknown>)?.refs as string).filter(Boolean) as string[],
    };
  } catch {
    return {};
  }
}
