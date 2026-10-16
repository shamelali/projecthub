/**
 * Rotate the password for a credential (email + password) account.
 *
 * Usage:
 *   DEMO_PASSWORD='...' pnpm tsx scripts/set-demo-password.ts
 *
 * The password is never printed or written to the repo. It is hashed with the
 * same Better Auth scrypt implementation the server verifies against, then
 * written straight to the `account` row.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const db = new PrismaClient();

const EMAIL = (process.env.DEMO_EMAIL ?? 'demo@projecthub.dev').toLowerCase();
const PASSWORD = process.env.DEMO_PASSWORD;

// A previous default was committed to git history. Refuse to reuse it so a
// rotated secret can never silently regress to the leaked value.
const KNOWN_LEAKED = new Set(['projecthub-demo-2026']);

async function main() {
  if (!PASSWORD) {
    throw new Error('DEMO_PASSWORD is required. Refusing to set an empty password.');
  }

  if (PASSWORD.length < 16) {
    throw new Error(`DEMO_PASSWORD must be at least 16 characters (got ${PASSWORD.length}).`);
  }

  if (KNOWN_LEAKED.has(PASSWORD)) {
    throw new Error('That password was committed to git history and must not be reused.');
  }

  const user = await db.user.findUnique({ where: { email: EMAIL }, select: { id: true } });

  if (!user) {
    throw new Error(`No user found for ${EMAIL}. Run \`pnpm db:seed\` first.`);
  }

  const hash = await hashPassword(PASSWORD);

  await db.account.upsert({
    where: { id: user.id },
    update: { password: hash, providerId: 'credential', accountId: user.id },
    create: {
      id: user.id,
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: hash,
    },
  });

  // Force re-authentication everywhere: existing sessions were minted under the
  // old credential and must not survive a password change.
  const { count } = await db.session.deleteMany({ where: { userId: user.id } });

  console.log(`Password updated for ${EMAIL}. Revoked ${count} active session(s).`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
