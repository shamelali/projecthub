import { PrismaAdapter } from '@auth/prisma-adapter';
import type { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import GitLab from 'next-auth/providers/gitlab';

import { db } from '@/lib/db';

const isConfigured = (value: string | undefined) => Boolean(value?.trim());
const isDemoCredentialsEnabled =
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
  isConfigured(process.env.DEMO_EMAIL) &&
  isConfigured(process.env.DEMO_PASSWORD);

const providers = [
  isConfigured(process.env.GITHUB_ID) && isConfigured(process.env.GITHUB_SECRET)
    ? GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        allowDangerousEmailAccountLinking: false,
      })
    : null,
  isConfigured(process.env.GITLAB_ID) && isConfigured(process.env.GITLAB_SECRET)
    ? GitLab({
        clientId: process.env.GITLAB_ID,
        clientSecret: process.env.GITLAB_SECRET,
        allowDangerousEmailAccountLinking: false,
      })
    : null,
  isDemoCredentialsEnabled
    ? Credentials({
        name: 'Demo Account',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const email = credentials?.email;
          const password = credentials?.password;

          if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            email !== process.env.DEMO_EMAIL ||
            password !== process.env.DEMO_PASSWORD
          ) {
            return null;
          }

          const user = await db.user.upsert({
            where: { email },
            update: {},
            create: { email, name: email.split('@')[0] },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        },
      })
    : null,
].filter((provider) => provider !== null);

export const configuredProviders = {
  github: isConfigured(process.env.GITHUB_ID) && isConfigured(process.env.GITHUB_SECRET),
  gitlab: isConfigured(process.env.GITLAB_ID) && isConfigured(process.env.GITLAB_SECRET),
  credentials: isDemoCredentialsEnabled,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }

      const tokenId = typeof token.id === 'string' ? token.id : undefined;

      if (tokenId && !token.role) {
        const currentUser = await db.user.findUnique({
          where: { id: tokenId },
          select: { role: true },
        });
        token.role = currentUser?.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
        session.user.role = typeof token.role === 'string' ? (token.role as UserRole) : 'PERSONAL';
      }
      return session;
    },
  },
});
