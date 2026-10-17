/**
 * Next.js instrumentation hook.
 *
 * The Sentry SDK requires `Sentry.init` to run from here rather than from
 * `sentry.server.config.ts` / `sentry.edge.config.ts`; without this the SDK
 * reports an incomplete configuration.
 */
export async function register() {
  // Edge runtime has no Node APIs, so it needs its own init.
  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initEdge } = await import('@/lib/sentry/edge');
    initEdge();
    return;
  }

  const { initServer } = await import('@/lib/sentry/server');
  initServer();
}
