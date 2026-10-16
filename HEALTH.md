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

## Deployment ✅

- **Live:** https://projecthub-ashy-sigma.vercel.app
- `projecthub.vercel.app` is **NOT** this project — it is claimed by another
  project on a different team (Vercel returns 409 `owned-on-other-team`). Do not
  use it as `NEXTAUTH_URL`.
- Scope `duta-integra` (Hobby, $0). Project `projecthub`, `prj_HGYMvxl3AWm43FqamAA3D88KK3jg`
- Env vars for Production + Preview: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
  `NEXTAUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXTAUTH_URL`
- `postinstall: prisma generate` is required — Vercel caches dependencies and
  otherwise fails with `PrismaClientInitializationError` on `/api/projects`
- Dark theme is the default (`html.dark` + `color-scheme: dark`)

## Gotcha: commit author must be a real GitHub identity

The repo was authored as `shamelali@example.com`, which maps to no GitHub
account. Vercel blocked every deploy with:

> The deployment was blocked because Vercel couldn't find a Git account for the
> commit author.

Local `git config user.email` is now `shamelali@gmail.com`. A placeholder email
here silently blocks all deployments.

## Blockers

- **GitHub Actions disabled account-wide**: "The job was not started because your
  account is locked due to a billing issue." Only the Pro Vercel scope
  (`shamelalis-projects`) is suspended; Hobby works fine.
- **No production login path**: `lib/auth.ts` enables credentials only when
  `NODE_ENV` is development/test, and `GITHUB_ID`/`GITHUB_SECRET` are empty. In
  production the login page renders "No sign-in providers are configured."
  Needs a real GitHub/GitLab OAuth app before anyone can sign in.
- **Unverified:** middleware does not emit a redirect for unauthenticated
  `/dashboard` (returns 200, empty body). Pages still fail closed via
  `session?.user?.id ? projectAccessWhere(id) : { id: '' }`, so no data leaks.
  Confirm redirect behaviour in a browser.

## Security Note

Vercel's CLI echoed the Neon `DATABASE_URL` (including the password) into the
terminal while rejecting a malformed `env add`. Rotate the Neon role password if
that session log is shared or stored anywhere.

The demo password `projecthub-demo-2026` was committed in `bd23e2a` as a seed
fallback and was a live credential. It has been rotated; the new value lives in
`~/.secrets/projecthub` and is never committed. `scripts/secret-scan.sh` runs on
every pre-push and blocks that class of regression.

Git history still contains the old string. Rewriting it is not worth the risk on
a live repo now that the value is rotated and the repo is private.

## Demo account

`demo@projecthub.dev` is a real login on production. Local dev and production
share one Neon branch, so this credential cannot be scoped to local only. The
seeded data is fictional. Remove it with `pnpm exec tsx` plus a delete, or leave
it for demos.

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
