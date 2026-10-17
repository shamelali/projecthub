# Database Documentation

ProjectHub — Neon PostgreSQL + Prisma

**Version:** 1.0  
**Status:** Draft  
**Last updated:** 2026-10-17  
**Owner:** Engineering

---

## Source of truth

`prisma/schema.prisma` is the canonical data model. This doc summarizes it; the schema file always wins on conflict.

## Connection

- Runtime: `DATABASE_URL` — Neon pooled (PgBouncer) endpoint; safe for serverless concurrency.
- Migrations: `DATABASE_URL_UNPOOLED` — direct connection; required because transaction pooling does not support session state (fails with `prepared statement "s0" already exists`).
- Local dev: `docker compose up -d db` → `postgres:16`, user/pass/db `projecthub`, port 5432.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to dev DB (skip migrations) |
| `pnpm db:migrate` | Create + apply a new migration (dev) |
| `pnpm db:migrate:deploy` | Apply migrations in production |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed demo data |

**Rule:** After editing `schema.prisma`, run `pnpm db:migrate` (dev). Never hand-edit migration SQL.

## Existing migration

`prisma/migrations/20260928024206_init/` — initial schema (all core entities and enums).

## Entity summary

| Entity | Key fields | Relations |
|--------|-----------|-----------|
| User | id, email, name, role, githubId, gitlabId | projects (owned), members, tasks, comments, sessions, notes, logs |
| Project | id, name, slug, description, path, repositoryUrl, status, visibility, ownerId | members, tasks, commits, branches, deployments, sessions, notes, settings |
| ProjectMember | userId, projectId, role (OWNER/ADMIN/MEMBER/VIEWER) | user, project |
| Task | title, status, priority, position, projectId, assigneeId, reporterId | project, assignee, reporter, comments, subtasks |
| TaskComment | content, taskId, userId | task, user |
| GitCommit | sha, message, author, projectId, branchName | project |
| GitBranch | name, isDefault, projectId | project |
| GitRemote | name, url, projectId | project |
| Deployment | provider, externalId, url, status, environment, projectId | project |
| OpenCodeSession | sessionId, model, provider, status, projectId, userId | project, user |
| MCPServer | name, type, url, status, projectId, isGlobal | project (optional) |
| ProjectNote | title, content, projectId, userId, isPinned | project, user |
| Notification | type, title, message, read, userId, projectId? | user, project (optional) |
| ActivityLog | action, entityType, entityId, userId?, projectId?, metadata? | user (optional), project (optional) |
| ProjectSettings | projectId, autoScan, scanIntervalMinutes, clientShareToken, clientShareScope | project |
| UserPreferences | userId, theme, defaultView, projectsPath, notifications, shortcuts | user |

## Enums

| Enum | Values |
|------|--------|
| UserRole | PERSONAL, TEAM, ADMIN, CLIENT |
| Visibility | PRIVATE, TEAM, PUBLIC, CLIENT |
| MemberRole | OWNER, ADMIN, MEMBER, VIEWER |
| ProjectStatus | ACTIVE, ARCHIVED, ON_HOLD, DEPRECATED |
| TaskStatus | BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED |
| Priority | LOW, MEDIUM, HIGH, CRITICAL |
| SessionStatus | ACTIVE, COMPLETED, FAILED, ARCHIVED |
| MCPStatus | CONNECTED, DISCONNECTED, ERROR, UNKNOWN |
| DeploymentStatus | PENDING, BUILDING, DEPLOYING, SUCCESS, FAILED, CANCELLED |
| DeploymentEnv | PREVIEW, PRODUCTION, STAGING, DEVELOPMENT |
| DeploymentProvider | VERCEL, NETLIFY, CLOUDFLARE, DOCKER, KUBERNETES, OTHER |
| NotificationType | TASK_ASSIGNED, TASK_UPDATED, COMMENT_ADDED, DEPLOYMENT_SUCCESS, DEPLOYMENT_FAILED, GIT_PUSH, MCP_STATUS_CHANGE, SESSION_COMPLETED, MENTION, SYSTEM |

## Indexes (selected)

- `Project(ownerId)`, `Project(status)`, `Project(lastActivityAt)`, `Project(path)`
- `ProjectMember(projectId)`, unique `ProjectMember(userId, projectId)`
- `Task(projectId, status)`, `Task(assigneeId)`, `Task(parentId)`
- `Notification(userId, read)`, `ActivityLog(projectId, createdAt)`, `ActivityLog(userId, createdAt)`
- `OpenCodeSession(projectId, startedAt)`, `OpenCodeSession(userId, startedAt)`

## Access control pattern

```ts
projectAccessWhere(userId) = {
  OR: [{ ownerId: userId }, { members: { some: { userId } } }]
}
```
Used by project detail, project list, and task access. Server actions layer role checks on top (MEMBER+/ADMIN+/OWNER).

## Migrations & branching

- Neon branches are recommended for testing migrations with real data (see `neon-postgres-branches`).
- Create migration: `pnpm db:migrate --name <descriptive>`.
- Review generated SQL before committing the migration folder.
- Production: `pnpm db:migrate:deploy`.

## Backup / restore

- Neon: point-in-time restore + instant restore from branches.
- Self-hosted Docker: `pg_dump` / `pg_restore` against the local postgres container.
- Schedule regular backups; test restore quarterly.

## Gotchas

- Do not run migrations against the pooled (`-pooler`) connection string; use `DATABASE_URL_UNPOOLED`.
- `emailVerified` is Boolean (Better Auth requirement), not a timestamp.
- `clientShareToken` is `@unique` — regenerate on collision.
