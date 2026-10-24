# Contributing to ProjectHub

**Last updated:** 2026-10-17

## Setup

1. Fork and clone the repository.
2. From `Project/Active/projecthub/`:
   ```bash
   corepack enable pnpm
   pnpm install
   cp .env.local.example .env.local
   # edit .env.local
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   docker compose up -d db   # local Postgres
   pnpm dev
   ```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` / `build` / `start` | Dev server / production build / start |
| `pnpm lint` / `lint:fix` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm format` | Prettier (run before committing) |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright |
| `pnpm db:generate|db:push|db:migrate|db:studio|db:seed` | Database |

## Code style

- TypeScript strict; Prettier with `@ianvs/prettier-plugin-sort-imports`.
- Run `pnpm format` before committing.
- Server actions: `'use server'`, `auth()` guard, permissions check, `revalidatePath`.
- New docs: update in same PR as code changes.

## Pull requests

1. Create a feature branch from `main`.
2. Implement + tests + docs.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`.
4. Open PR; describe changes and link issues.

## Secrets

Never commit plaintext keys. Use `~/.secrets/env` and `{env:…}` references.
