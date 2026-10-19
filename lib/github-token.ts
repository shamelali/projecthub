/**
 * GitHub OAuth token lookup.
 *
 * Kept free of `@/lib/github` imports so server-only code (the sync helpers)
 * and edge-safe auth hooks can both reach it without pulling in the fetch
 * layer transitively.
 */

import { db } from '@/lib/db';

/** The stored GitHub access token for a user, or null when not linked. */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const account = await db.account.findFirst({
    where: { userId, providerId: 'github' },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}
