# ProjectHub Health Check

_Updated 2026-10-16. Verified against actual command output, not aspirational._

## Stack Versions

- Next.js: 15
- React: 19
- TypeScript: 6.0.3, strict
- Tailwind: 4.3.3 (v3 config shim)
- Prisma: 5.22
- pnpm: 12.8.1
- Node: 24.22.0 (local), 20 (CI)

## Blockers

- **GitHub Actions disabled account-wide**: "The job was not started because your
  account is locked due to a billing issue." This must be resolved on GitHub before
  CI can run. Not a code problem.
- **CI secrets unset**: `NEXTAUTH_SECRET` and `DATABASE_URL` are missing from repo
  secrets, so the Build step will fail once Actions is unblocked.
- **No Vercel project**: `projecthub` does not exist in the `duta-integra` Vercel
  account and there is no `.vercel` link. Nothing is deployed.

## Config Status ✅

- tsconfig: deprecated `baseUrl` removed; aliases resolve via `paths`
- ESLint: flat config (`eslint.config.mjs`); `.eslintrc.json` deleted
- next.config.js: ESM `export default`; `experimental.ppr` dropped
- Prisma: Account/Session/VerificationToken adapter models + migration
- prettier: applied across the codebase; importOrder TS version 5.0.0
- docker-compose: v3.9 + restart policy
- gitignore: prisma migrations tracked, tsbuildinfo ignored

## Scripts Ready

- ./scripts/dev-setup.sh → local DB + seed
- ./scripts/seed-wrapper.sh → re-seed
- ./scripts/push-init.sh → push to origin/main
- ./scripts/vercel-deploy.sh → Vercel prep
- pnpm db:reset → push + seed

## Verification Status ✅

- `pnpm typecheck` → pass
- `pnpm lint` → pass (2 warnings: unused `Separator`, unused `router`)
- `pnpm test` → pass (6 tests, 2 files)

## Repo State

- Branch `main`, tracking `origin/main` (SSH remote)
- Working tree clean

## MCP Ready

- GitHub CLI ✅
- Vercel CLI ✅
- Wrangler ✅ registered
- .env.mcp template created

## Next Actions

1. Resolve the GitHub billing lock to re-enable Actions
2. Set `NEXTAUTH_SECRET` + `DATABASE_URL` repo secrets
3. Create/link the Vercel project
4. Fill .env.mcp tokens
