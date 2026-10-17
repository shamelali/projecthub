# Architecture Decision Records

ProjectHub

**Last updated:** 2026-10-17

## Template

```
# ADR-NNN: Title

## Status
Proposed / Accepted / Superseded / Deprecated

## Date
YYYY-MM-DD

## Context
...

## Decision
...

## Consequences
...
```

## ADR-001: Next.js 15 App Router

**Status:** Accepted  
**Date:** 2026-10-17  

**Context:** ProjectHub needs a full-stack React framework with server-side rendering, API routes, and a familiar deployment target (Vercel).

**Decision:** Use Next.js 15 with the App Router, React 19, TypeScript strict mode, and `output: 'standalone'`.

**Consequences:** Server Components by default; Server Actions for mutations; Vercel-optimized deployment; steep learning curve for App Router patterns.

---

## ADR-002: Neon PostgreSQL + Prisma ORM

**Status:** Accepted  
**Date:** 2026-10-17  

**Context:** Need a managed Postgres with branching, scale-to-zero, and easy local/dev parity.

**Decision:** Neon PostgreSQL accessed via Prisma ORM. Runtime uses the pooled (PgBouncer) endpoint; migrations use the direct (`_UNPOOLED`) endpoint.

**Consequences:** Branch-first workflow available; must never run migrations on the pooled connection; `DATABASE_URL` + `DATABASE_URL_UNPOOLED` both required.

---

## ADR-003: NextAuth v5 (Auth.js)

**Status:** Accepted  
**Date:** 2026-10-17  

**Context:** Authentication with GitHub, GitLab, and Credentials providers; Prisma adapter for session/account storage.

**Decision:** NextAuth v5 with Prisma adapter, session callbacks injecting `user.id` and `user.role`, `authorized` middleware protecting `/dashboard/*`.

**Consequences:** Credentials login restricted to non-production with `DEMO_EMAIL`/`DEMO_PASSWORD`; OAuth buttons gated behind configured credentials.

---

## ADR-004: Tailwind CSS + shadcn/ui

**Status:** Accepted  
**Date:** 2026-10-17  

**Context:** Need an accessible, consistent UI component library with theming.

**Decision:** Tailwind CSS + shadcn/ui (Radix primitives), import order enforced by `@ianvs/prettier-plugin-sort-imports`.

**Consequences:** Components are copied into the repo (ownable/customizable); Prettier must run before commits.

---

## ADR-005: pnpm as package manager

**Status:** Accepted  
**Date:** 2026-10-17  

**Decision:** Enforce pnpm via `corepack enable`, `devEngines`, and `packageManager` field.

**Consequences:** `pnpm-workspace.yaml` only configures `allowBuilds` (not a real monorepo); each package is self-contained.

---

## ADR-006: Supabase Realtime (planned)

**Status:** Proposed  
**Date:** 2026-10-17  

**Context:** Real-time sync for Kanban and notifications is planned for MVP v0.2.

**Decision:** Adopt Supabase Realtime; keys stored as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Consequences:** Additional dependency and env vars; real-time features deferred until v0.2.

---

## How to add a new ADR

Copy `template` above into `docs/adr/adr-NNN-title.md`, fill in Context/Decision/Consequences, and set Status to `Proposed`. Move to `Accepted` after team agreement.
