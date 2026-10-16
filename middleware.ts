import { getSessionCookie } from 'better-auth/cookies';

import { authServer } from '@/lib/auth-server';

/**
 * Fast-path redirect for unauthenticated visitors.
 *
 * This only inspects the presence of a session cookie so it stays cheap and
 * edge-safe. The authoritative check is the server-side `auth()` call in the
 * dashboard layout and in every route handler / server action, so a forged or
 * stale cookie cannot reach data.
 */
export default function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return;
  }

  const hasSessionCookie = Boolean(getSessionCookie(req));

  if (!hasSessionCookie) {
    return Response.redirect(new URL('/login', req.url));
  }
}

/**
 * Kept for parity with the Auth.js setup. Middleware must not import the
 * Prisma-backed adapter, so the instance reference is intentionally unused
 * here — it documents that this file stays free of database access.
 */
void authServer;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
