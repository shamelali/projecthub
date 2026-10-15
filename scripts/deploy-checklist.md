# 🚀 ProjectHub Deploy Checklist

## Pre-Deploy
- [ ] Env vars set in Vercel
  - `DATABASE_URL` (Neon production)
  - `NEXTAUTH_SECRET` (32+ chars)
  - `NEXTAUTH_URL` (https://yourapp.vercel.app)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Prisma migrations run on prod DB
- [ ] Seed production data if needed
- [ ] GitHub repo connected to Vercel

## Vercel Deployment
1. Import GitHub repo → projecthub
2. Framework: Next.js
3. Root Directory: `/`
4. Build Command: `pnpm build`
5. Install Command: `pnpm install`
6. Add env vars above
7. Deploy → Production

## Cloudflare Pages (Static Assets / Workers)
- [ ] Connect Cloudflare Pages to GitHub
- [ ] Build output: `.next`
- [ ] Functions directory: `app`
- [ ] Env vars synced from Vercel
- [ ] Custom domain configured

## Post-Deploy
- [ ] Run `pnpm db:migrate` on prod
- [ ] Smoke test login, dashboard, projects
- [ ] Check logs in Vercel → Functions
- [ ] Monitor errors via Sentry/Logflare
- [ ] Set up preview deployments for PRs

## Rollback Plan
- Vercel: Promote previous deployment
- DB: Restore Neon backup point-in-time

## Security
- [ ] Rotate `NEXTAUTH_SECRET` in prod
- [ ] Enable Vercel Protection rules
- [ ] Cloudflare WAF enabled
- [ ] Rate limiting configured
