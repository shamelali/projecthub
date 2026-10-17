import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Workers (OpenNext on Cloudflare) cannot share TCP sockets between requests:
// a connection opened in one request is dead by the next. Node runtimes
// (Vercel, local dev) don't have that limitation and benefit from a pooled
// singleton, so the client strategy is picked per runtime.
function isWorkers(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Cloudflare-Workers');
}

/**
 * Hyperdrive binding, when deployed on Workers with one configured. Its
 * connection string routes through Cloudflare's pooler, so each request no
 * longer pays a fresh TCP+TLS handshake to Neon. Falls back to DATABASE_URL
 * (local dev without a binding, Vercel, or a missing/failed context).
 */
function workersConnectionString(): string | null {
  try {
    const env = getCloudflareContext().env as {
      HYPERDRIVE?: { connectionString?: string };
    };
    return env.HYPERDRIVE?.connectionString ?? null;
  } catch {
    return null;
  }
}

function createPrismaClient(): PrismaClient {
  const connectionString =
    (isWorkers() ? workersConnectionString() : null) ?? process.env.DATABASE_URL ?? '';
  // maxUses: 1 — never reuse a socket across requests on Workers (Hyperdrive
  // handles the pooling on its side).
  const pool = new Pool(isWorkers() ? { connectionString, maxUses: 1 } : { connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// `cache` dedupes per request, so Workers get one client per request while
// Node keeps reusing the global singleton.
export const getDb = cache(() => {
  if (isWorkers()) return createPrismaClient();
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
});

// Stable `db` import surface: forwards to the runtime-appropriate client.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get: (_target, prop, receiver) => Reflect.get(getDb(), prop, receiver),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = getDb();
