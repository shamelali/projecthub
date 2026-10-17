import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { syncGitHubRepositories, syncProjectGitData } from '@/lib/github';

const isConfigured = (value: string | undefined) => Boolean(value?.trim());

const DEMO_EMAIL = 'demo@projecthub.dev';
const isDemoMode = process.env.DEMO_MODE === 'true';

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
    // Require email verification before sign-in is allowed in production.
    requireEmailVerification: process.env.NODE_ENV === 'production',
    async sendResetPassword({ user, url, token }, _request) {
      await sendEmail({
        to: user.email,
        subject: 'Reset your ProjectHub password',
        text: `Reset your password: ${url}\n\nToken: ${token}\n\nIf you didn't request this, ignore this email.`,
        html: `<p>Reset your password: <a href="${url}">${url}</a></p><p>Token: <code>${token}</code></p><p>If you didn't request this, ignore this email.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    expiresIn: 60 * 60 * 24, // 24 hours
    async sendVerificationEmail({ user, url, token }, _request) {
      await sendEmail({
        to: user.email,
        subject: 'Verify your ProjectHub email',
        text: `Verify your email address: ${url}\n\nToken: ${token}\n\nIf you didn't sign up for ProjectHub, ignore this email.`,
        html: `<p>Verify your email address: <a href="${url}">${url}</a></p><p>Token: <code>${token}</code></p><p>If you didn't sign up for ProjectHub, ignore this email.</p>`,
      });
    },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60, // 1 minute
    max: 10, // 10 requests per window
    storage: 'memory',
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
  databaseHooks: {
    session: {
      create: {
        /**
         * Auto-populate a GitHub user's repositories as projects the first time
         * they sign in with GitHub and have no projects yet.
         *
         * Runs in the background and swallows every error: repository import is
         * a best-effort convenience and must never block or break sign-in.
         */
        after: async (session) => {
          void (async () => {
            try {
              const account = await db.account.findFirst({
                where: { userId: session.userId, providerId: 'github' },
                select: { accessToken: true },
              });
              const accessToken = account?.accessToken;
              if (!accessToken) return;

              const projectCount = await db.project.count({
                where: { ownerId: session.userId },
              });
              if (projectCount > 0) return;

              const { newProjectIds } = await syncGitHubRepositories({
                userId: session.userId,
                accessToken,
              });

              // Best-effort: sync branches + recent commits for newly imported
              // projects. Failures are swallowed so sign-in is never blocked.
              await Promise.all(
                newProjectIds.map((projectId) =>
                  syncProjectGitData({
                    projectId,
                    userId: session.userId,
                    accessToken,
                  })
                )
              );
            } catch {
              // Intentionally swallowed: sign-in must not fail because GitHub
              // is unreachable or the token lacks the `repo` scope.
            }
          })();
        },
        /**
         * Block the demo account from signing in via credentials when not in
         * demo mode. The demo user record may exist in the database from a
         * previous seed, but without DEMO_MODE=true it must not be usable.
         */
        before: async (session) => {
          if (isDemoMode) return;

          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          });

          if (user?.email === DEMO_EMAIL) {
            throw new Error(
              'Demo account is disabled. Create your own account to sign in.',
            );
          }
        },
      },
    },
  },
  socialProviders: {
    // Linking an OAuth identity to an existing account by matching email is a
    // silent account-takeover vector. Keep it off for every provider.
    ...(isConfigured(process.env.GITHUB_ID) && isConfigured(process.env.GITHUB_SECRET)
      ? {
          github: {
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
            // Request the `repo` scope so we can list the user's repositories
            // after sign in (`read:user`/`user:email` are added by default).
            scope: ['repo'],
          },
        }
      : {}),
    ...(isConfigured(process.env.GITLAB_ID) && isConfigured(process.env.GITLAB_SECRET)
      ? {
          gitlab: {
            clientId: process.env.GITLAB_ID as string,
            clientSecret: process.env.GITLAB_SECRET as string,
          },
        }
      : {}),
  },
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});

export type AuthServer = typeof authServer;

// Default export so the Better Auth CLI (`better-auth generate`) can load this
// config. Kept in sync by construction — it is the same instance.
export default authServer;
