# ProjectHub Documentation

Welcome to the ProjectHub documentation. This folder contains operational and user-facing documentation for developers and operators.

## How to navigate

| Document | Audience | Purpose |
|----------|----------|---------|
| [`README.md`](README.md) | Everyone | This index |
| [`user-manual.md`](user-manual.md) | End users | How to create projects, manage tasks, share with teammates, use the client portal |
| [`operations.md`](operations.md) | Operators / DevOps | Installation, configuration, deployment, backups, monitoring |
| [`api.md`](api.md) | Developers | Server Actions and API route reference |
| [`database.md`](database.md) | Developers / DBAs | Schema, migrations, indexes, backup/restore |
| [`glossary.md`](glossary.md) | Everyone | Terminology used across the project |
| [`faq.md`](faq.md) | Everyone | Frequently asked questions |

## Related spec documents

Formal specifications live in `Project/Docs/projecthub-specs/`:

- `prd.md` — Product Requirements Document
- `srs.md` — Software Requirements Specification
- `sdd.md` — Software Design Document
- `test-plan.md` — Test Strategy & Plan

Architecture Decision Records live in `docs/adr/`.

## Source of truth

- `prisma/schema.prisma` is the canonical data model.
- `README.md` (project root) is the canonical feature list and setup instructions.
- `next.config.js`, `middleware.ts`, and `prisma/migrations/` are the canonical runtime configuration.

## Conventions

- Dates use ISO 8601 (`YYYY-MM-DD`). Today is `2026-10-17`.
- Environment variable names are shown in UPPER_SNAKE_CASE; never paste secret values.
- Features marked "Planned" or "Post-MVP" are aspirational, not yet implemented.

## Maintenance

Each document carries a `Last updated` header. When changing code that affects docs (new route, new env var, changed schema), update the affected doc in the same PR.