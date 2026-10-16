import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { db } from '@/lib/db';

const isConfigured = (value: string | undefined) => Boolean(value?.trim());

/**
 * Self-hosted Better Auth (the successor Auth.js was folded into).
 *
 * Identity lives in the existing `User` table, so `auth().user.id` is the same
 * primary key the rest of the app already stores on projects, tasks and
 * preferences. Nothing in the domain layer had to change.
 *
 * This module must stay free of `next/headers` so middleware can import the
 * instance on the edge runtime.
 */
export const authServer = betterAuth({
  appName: 'ProjectHub',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    modelName: 'User',
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'PERSONAL',
        // Never accepted from the client: roles are assigned by the app, not
        // self-service signup.
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  socialProviders:
    isConfigured(process.env.GITHUB_ID) && isConfigured(process.env.GITHUB_SECRET)
      ? {
          github: {
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
            // Linking an OAuth identity to an existing account by matching email
            // is a silent account-takeover vector. Keep it off.
            allowDangerousEmailAccountLinking: false,
          },
        }
      : undefined,
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});

export type AuthServer = typeof authServer;

// Default export so the Better Auth CLI (`better-auth generate`) can load this
// config. Kept in sync by construction — it is the same instance.
export default authServer;
