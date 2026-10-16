import { cache } from 'react';
import { headers } from 'next/headers';
import type { UserRole } from '@prisma/client';
import { toNextJsHandler } from 'better-auth/next-js';

import { authServer } from '@/lib/auth-server';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
}

/**
 * Session accessor shaped like the old Auth.js `auth()` so that call sites
 * across the app (`auth()` then `session?.user?.id`) keep working unchanged.
 *
 * The Better Auth user id *is* the `User` primary key, so the id returned here
 * is the same value stored on projects, tasks, and preferences.
 */
export const auth = cache(async (): Promise<{ user: SessionUser } | null> => {
  const result = await authServer.api.getSession({ headers: await headers() });
  const user = result?.user;

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      image: user.image ?? null,
      role: (user.role as UserRole | undefined) ?? 'PERSONAL',
    },
  };
});

export const handlers = toNextJsHandler(authServer);

/** Providers offered on the sign-in screen. */
export const configuredProviders = {
  github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
  gitlab: Boolean(process.env.GITLAB_ID && process.env.GITLAB_SECRET),
  emailAndPassword: true,
};
