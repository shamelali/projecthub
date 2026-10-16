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

## Blockers — all external billing, none are code

- **GitHub Actions disabled account-wide**: "The job was not started because your
  account is locked due to a billing issue."
- **Vercel account suspended**: `vercel link` fails with "Your account has been
  suspended. To reactivate your subscription, add a valid payment method."
  This blocks creating the project and deploying.
- **No production login path**: `lib/auth.ts` enables credentials only when
  `NODE_ENV` is development/test, and `GITHUB_ID`/`GITHUB_SECRET` are empty. In
  production the login page renders "No sign-in providers are configured."
  Needs a real GitHub/GitLab OAuth app before anyone can sign in.

Both billing issues need the account owner and cannot be fixed from the repo.

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

## Database ✅

Neon project `lingering-flower-74601218` (`lingering-flower`), region
`aws-us-east-2`, Postgres 18, branch `production` (`br-lingering-flower-b58vrr1t`).

- Pooled `DATABASE_URL` for runtime, `DATABASE_URL_UNPOOLED` as Prisma `directUrl`
  for migrations. Migrations must bypass PgBouncer transaction pooling.
- Both migrations applied. Seeded: 1 user, 4 projects, 14 tasks.
- `neon.ts` keeps `auth: false` — NextAuth v5 remains the identity provider.

## Verification Status ✅

- `pnpm typecheck` → pass
- `pnpm lint` → pass, 0 warnings
- `pnpm test` → pass (6 tests, 2 files)
- `pnpm build` → pass (exit 0, 14 routes)
- End-to-end: credentials login → session → authenticated pages render seeded
  projects and tasks from Neon

## CI Secrets ✅

`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_SECRET` are all set as repo
secrets. CI will pass the moment Actions is unblocked.

## Repo State

- Branch `main`, tracking `origin/main` (SSH remote)
- Working tree clean

## MCP Ready

- GitHub CLI ✅
- Vercel CLI ✅
- Wrangler ✅ registered
- .env.mcp template created

## Next Actions

1. Reactivate the Vercel subscription (add a valid payment method)
2. Resolve the GitHub billing lock to re-enable Actions
3. Create a GitHub OAuth app and set `GITHUB_ID`/`GITHUB_SECRET` so login works
4. Link the Vercel project and deploy once step 1 is done
5. Fill .env.mcp tokens
