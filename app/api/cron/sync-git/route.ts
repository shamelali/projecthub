import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { db } from '@/lib/db';
import { syncProjectGitData } from '@/lib/github';

// Hobby plan caps Node functions at 60s. 79 repo-linked projects × ~2s each
// would blow that sequentially, so the run below fans out across workers and
// keeps a time budget as a backstop.
export const maxDuration = 60;

const MONITOR_SLUG = 'daily-git-sync';
const CONCURRENCY = 8;
// Stop launching new syncs after this many milliseconds; in-flight ones finish.
const TIME_BUDGET_MS = 50_000;

interface SyncOutcome {
  projectId: string;
  synced: boolean;
  skipped?: 'no-token';
  failed?: string;
  branches?: number;
  commits?: number;
}

/**
 * Daily refresh of git activity (branches + commits) for every project linked
 * to a GitHub repository, and of `lastActivityAt` from the newest commit.
 *
 * Invoked by the Vercel Cron job defined in vercel.json (`0 4 * * *`), which
 * sends `Authorization: Bearer $CRON_SECRET` when that env var is set.
 * `withMonitor` reports the run as a Sentry cron monitor check-in (ok/error)
 * and upserts the monitor's expected schedule on first run.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await Sentry.withMonitor(MONITOR_SLUG, async () => runSync(), {
      schedule: { type: 'crontab', value: '0 4 * * *' },
      timezone: 'UTC',
      // Hobby cron can drift within its hour — tolerate that before paging.
      checkinMargin: 60,
      maxRuntime: 10,
    });
    return NextResponse.json(summary);
  } catch (error) {
    // withMonitor already recorded an error check-in for the failed run.
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

async function runSync() {
  const startedAt = Date.now();

  const projects = await db.project.findMany({
    where: { repositoryUrl: { not: null } },
    select: { id: true, ownerId: true },
  });

  const ownerIds = [...new Set(projects.map((p) => p.ownerId))];
  const accounts = await db.account.findMany({
    where: { userId: { in: ownerIds }, providerId: 'github' },
    select: { userId: true, accessToken: true },
  });
  const tokenByOwner = new Map(accounts.map((a) => [a.userId, a.accessToken]));

  const outcomes: SyncOutcome[] = [];
  const queue = [...projects];

  async function worker() {
    for (;;) {
      const project = queue.shift();
      if (!project || Date.now() - startedAt > TIME_BUDGET_MS) return;
      const accessToken = tokenByOwner.get(project.ownerId);
      if (!accessToken) {
        outcomes.push({ projectId: project.id, synced: false, skipped: 'no-token' });
        continue;
      }
      try {
        const result = await syncProjectGitData({
          projectId: project.id,
          userId: project.ownerId,
          accessToken,
        });
        // Git activity only moves `lastActivityAt` forward — never backwards
        // over fresher in-app activity.
        const latest = await db.gitCommit.findFirst({
          where: { projectId: project.id },
          orderBy: { authorDate: 'desc' },
          select: { authorDate: true },
        });
        if (latest) {
          const current = await db.project.findUnique({
            where: { id: project.id },
            select: { lastActivityAt: true },
          });
          if (current && latest.authorDate > current.lastActivityAt) {
            await db.project.update({
              where: { id: project.id },
              data: { lastActivityAt: latest.authorDate },
            });
          }
        }
        outcomes.push({ projectId: project.id, synced: true, ...result });
      } catch (error) {
        outcomes.push({
          projectId: project.id,
          synced: false,
          failed: error instanceof Error ? error.message.slice(0, 200) : 'unknown',
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return {
    total: projects.length,
    synced: outcomes.filter((o) => o.synced).length,
    skipped: outcomes.filter((o) => o.skipped).length,
    failed: outcomes.filter((o) => o.failed).length,
    remaining: projects.length - outcomes.length,
    durationMs: Date.now() - startedAt,
  };
}
