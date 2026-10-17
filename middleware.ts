import { getSessionCookie } from 'better-auth/cookies';

/**
 * Fast-path redirect for unauthenticated visitors.
 *
 * This only inspects the presence of a session cookie so it stays cheap and
 * edge-safe. The authoritative check is the server-side `auth()` call in the
 * dashboard layout and in every route handler / server action, so a forged or
 * stale cookie cannot reach data.
 *
 * Note this file deliberately imports nothing from `@/lib/auth-server` or
 * `@/lib/db`: those pull the Prisma adapter in, and Prisma cannot run on the
 * edge runtime that middleware executes on.
 */
export default function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  // The marketing landing page is public — anonymous visitors must be able to
  // reach it and read it before deciding to sign in.
  if (pathname === '/') {
    return;
  }

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return;
  }

  const hasSessionCookie = Boolean(getSessionCookie(req));

  if (!hasSessionCookie) {
    return Response.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
