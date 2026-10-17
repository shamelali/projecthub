# Operations Guide

ProjectHub — Installation, deployment, and operations

**Version:** 1.0  
**Status:** Draft  
**Last updated:** 2026-10-17  
**Owner:** Engineering

---

## 1. Prerequisites

- Node.js >= 20
- pnpm (via corepack: `corepack enable pnpm`)
- Neon PostgreSQL database (or local Postgres 16 via Docker)
- GitHub/GitLab OAuth apps (optional, for OAuth sign-in)
- Supabase project (for Realtime — v0.2)
- Vercel account (recommended deployment) or Docker host

---

## 2. Local development

From `Project/Active/projecthub/`:

```bash
# Install dependencies
pnpm install

# Copy env from local example (not .env.example, which points at Neon)
cp .env.local.example .env.local   # or create .env.local manually
# Edit DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, etc.

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# Start local DB (Docker)
docker compose up -d db

# Start dev server
pnpm dev
```

Required env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Optional: `GITHUB_ID`, `GITHUB_SECRET`, `GITLAB_ID`, `GITLAB_SECRET`, `DEMO_EMAIL`, `DEMO_PASSWORD`, `VERCEL_TOKEN`, `NEXT_PUBLIC_APP_URL`, `BREVO_API_KEY`.

Secrets live in `~/.secrets/` (dir 700, files 600), exported from `~/.secrets/env` which `~/.bashrc` sources. Never commit plaintext keys.

---

## 3. Database

```bash
# Generate client after schema changes
pnpm prisma generate

# Create + apply migration (dev)
pnpm db:migrate --name <change-description>

# Deploy migrations (production)
pnpm db:migrate:deploy

# Inspect data
pnpm db:studio

# Seed demo data
pnpm db:seed
```

Migrations live in `prisma/migrations/`. Never hand-edit SQL.

---

## 4. Deployment — Vercel (recommended)

1. Push code to GitHub/GitLab.
2. Import project in Vercel.
3. Add environment variables (see §2).
4. Deploy.
5. Set `NEXTAUTH_URL` to your Vercel production URL.

Vercel builds with `output: 'standalone'`.

---

## 5. Deployment — Docker (self-host)

```bash
docker compose up -d   # starts app + postgres:16
docker compose logs -f app
docker compose down
```

Ensure `.env.local` points at the local Postgres (port 5432, `projecthub`/`projecthub`/`projecthub`).

---

## 6. Environment variables

| Variable                      | Required         | Description                       |
| ----------------------------- | ---------------- | --------------------------------- |
| DATABASE_URL                  | Yes              | Neon pooled connection string     |
| DATABASE_URL_UNPOOLED         | Yes (migrations) | Neon direct connection            |
| NEXTAUTH_SECRET               | Yes              | `openssl rand -base64 32`         |
| NEXTAUTH_URL                  | Yes              | Base URL of the app               |
| NEXT_PUBLIC_SUPABASE_URL      | Yes              | Supabase project URL              |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes              | Supabase anon key                 |
| GITHUB_ID / GITHUB_SECRET     | No               | GitHub OAuth                      |
| GITLAB_ID / GITLAB_SECRET     | No               | GitLab OAuth                      |
| DEMO_EMAIL / DEMO_PASSWORD    | No               | Credentials login (non-prod only) |
| VERCEL_TOKEN                  | No               | Deployment tracking               |
| NEXT_PUBLIC_APP_URL           | No               | Public app URL                    |
| BREVO_API_KEY                 | No               | Invite email delivery             |

---

## 7. Monitoring & maintenance

- Check Neon console for query performance, connections, egress.
- Review `ActivityLog` table for audit trail.
- Rotate `NEXTAUTH_SECRET` only with care (invalidates all sessions).
- Rotate client share tokens if leaked (`revokeClientShareToken` + regenerate).
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` before deploys.

---

## 8. Troubleshooting

| Issue                                    | Likely cause                       | Fix                               |
| ---------------------------------------- | ---------------------------------- | --------------------------------- |
| `prepared statement "s0" already exists` | Migration run on pooled connection | Use `DATABASE_URL_UNPOOLED`       |
| 403 on project page                      | User not owner/member              | Check `ProjectMember` row         |
| Invite email not received                | Brevo not configured               | Fall back to copyable in-app link |
| Slug duplicate                           | Project name collision             | Edit name/slug                    |
| OAuth button missing                     | Provider credentials missing       | Set `*_ID` and `*_SECRET`         |
