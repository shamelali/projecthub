# 🚀 ProjectHub Deploy Checklist

Target: **Neon** (hosted Postgres) + **Vercel Hobby** (free). Supabase is not used
for the database.

## Pre-Deploy

- [ ] Neon free project created, `projecthub` database exists
- [ ] Neon pooled connection string in `DATABASE_URL`
      (`-pooler` host, `?sslmode=require`)
- [ ] `NEXTAUTH_SECRET` generated: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` set to the final production origin
- [ ] Migrations applied to the production DB:
      `pnpm db:migrate:deploy` (never `pnpm db:migrate` — that is dev-only)
- [ ] Env vars added in Vercel (Production + Preview)
- [ ] `NEXT_PUBLIC_SUPABASE_*` only if realtime features are actually enabled —
      they are not required for the database and can be omitted

## Vercel Deployment

1. `vercel link` (creates/attaches the project; `.vercel/` is gitignored)
2. Framework preset: Next.js (auto-detected)
3. Root Directory: `/`
4. Install Command: `pnpm install --frozen-lockfile`
5. Build Command: `pnpm build`
6. Node: 22 or 24 (local uses 24.22.0; CI workflow uses 20)
7. Add env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
8. `vercel --prod`

## Post-Deploy

- [ ] Smoke test: `/login`, `/dashboard`, `/dashboard/projects`
- [ ] Confirm credentials login works against the real DB
- [ ] Check Vercel → Functions logs for runtime errors
- [ ] Add the production `DATABASE_URL` + `NEXTAUTH_SECRET` as GitHub repo secrets

## CI Caveat

GitHub Actions is currently blocked **account-wide** by a billing lock:

> The job was not started because your account is locked due to a billing issue.

This repo is public, so Actions minutes are free once billing is resolved — there is
no paid plan required. Until then, `scripts/pre-push-check.sh` (wired into
`.git/hooks/pre-push`) runs the same typecheck/lint/test gate locally.

## Rollback

- Vercel: promote a previous deployment
- DB: Neon point-in-time restore / branch

## Security

- [ ] Never commit `.env.vercel` (gitignored — verify it stays that way)
- [ ] Use the Neon **pooler** connection string in serverless contexts to avoid
      exhausting connections
- [ ] Rotate `NEXTAUTH_SECRET` if ever exposed
- [ ] Add rate limiting before exposing auth publicly
