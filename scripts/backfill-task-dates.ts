/**
 * Backfills `startedAt` on tasks auto-populated from commits.
 *
 * Earlier versions of `populateTasksFromProject` created tasks without dates,
 * so commit-sourced tasks rendered with no activity info. Each such task is
 * tagged `source:commit:<sha>`, and GitCommit rows carry the authoritative
 * `authorDate`, so the mapping is deterministic.
 *
 * Idempotent: only touches tasks whose `startedAt` is still null. Branch-sourced
 * tasks (`source:branch:`) are skipped — a branch's only stored date is its last
 * commit, which would misstate a start date.
 *
 * Usage: pnpm tsx scripts/backfill-task-dates.ts
 */
import { PrismaClient } from '@prisma/client';

import { COMMIT_TAG_PREFIX } from '@/lib/task-tags';

const db = new PrismaClient();

async function main() {
  const tasks = await db.task.findMany({
    where: { startedAt: null },
    select: { id: true, projectId: true, tags: true },
  });

  const commitTagged = tasks
    .map((task) => ({
      ...task,
      sha: task.tags.find((tag) => tag.startsWith(COMMIT_TAG_PREFIX))?.slice(COMMIT_TAG_PREFIX.length),
    }))
    .filter((task): task is typeof task & { sha: string } => Boolean(task.sha));

  console.log(
    `${tasks.length} task(s) without startedAt, ${commitTagged.length} of them commit-sourced.`
  );

  let updated = 0;
  let missing = 0;
  for (const task of commitTagged) {
    const commit = await db.gitCommit.findFirst({
      where: { projectId: task.projectId, sha: task.sha },
      select: { authorDate: true },
    });
    if (!commit) {
      // The commit row was pruned (only the last 50 are kept per sync), but the
      // tag is still authoritative enough to know a date existed.
      missing += 1;
      continue;
    }
    await db.task.update({
      where: { id: task.id },
      data: { startedAt: commit.authorDate },
    });
    updated += 1;
  }

  console.log(`Backfilled startedAt on ${updated} task(s); ${missing} commit row(s) not found.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
