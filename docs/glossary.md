# Glossary

ProjectHub terminology

**Last updated:** 2026-10-17

| Term | Meaning |
|------|---------|
| Project | A tracked software project: name, slug, path, repository URL, status, visibility, owner, members |
| Slug | URL-safe identifier derived from project name (lowercase, hyphenated) |
| ProjectMember | Join row linking a User to a Project with a MemberRole |
| MemberRole | OWNER / ADMIN / MEMBER / VIEWER — role hierarchy for project-scoped access |
| Visibility | PRIVATE / TEAM / PUBLIC / CLIENT — who can see a project |
| Client share token | Revocable UUID granting read-only, unauthenticated access to a project |
| ProjectInvitation | Pending invite row: email, project, role, hashed token, expiry |
| Server action | Next.js `'use server'` function executed on the server from client components |
| Kanban board | Task board with columns: Backlog, Todo, In Progress, In Review, Done, Blocked |
| Activity log | Audit trail of actions (who, what, entity, when, metadata) |
| Notification | Per-user in-app/email alert (task assigned, comment, deploy, etc.) |
| OpenCode session | AI coding session tracked against a project and user |
| MCP server | Model Context Protocol server registered for a project |
| Neon | Serverless Postgres provider (hosted database) |
| Supabase Realtime | Real-time sync backend (planned v0.2) |
| shadcn/ui | Accessible React component primitives built on Radix + Tailwind |
| Serverless / standalone | Next.js `output: 'standalone'` for efficient deployment |
