'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Talks to the same-origin proxy at /api/auth/*, so no public Auth URL or
 * extra client configuration is needed.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
