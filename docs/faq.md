# Frequently Asked Questions

ProjectHub

**Last updated:** 2026-10-17

## General

**Q: What is ProjectHub?**
A: A unified dashboard for developers and teams to track projects across local filesystems, Git, CI/CD, and AI coding sessions, with Kanban task management and role-based access.

**Q: Is it open source?**
A: Yes, MIT License.

**Q: How do I run it locally?**
A: See the Operations Guide (`docs/operations.md`) or the Installation section of the root README.

## Accounts & access

**Q: Who can see my projects?**
A: By default, only you (the owner) and members you invite. Visibility can be changed in project settings.

**Q: How do I invite a teammate?**
A: Open the project → Settings → Members → Invite member. Enter their email and choose a role.

**Q: What if the person doesn't have an account yet?**
A: An invitation is created (valid 7 days). They can accept it after signing up.

**Q: Can a Viewer edit tasks?**
A: No. Viewers have read-only access. Members can create/edit tasks; Admins can manage members and settings; Owners have full control.

## Sharing

**Q: Can I share a project with someone who doesn't have an account?**
A: Yes — generate a client share link in Settings → Client access. It's read-only and requires no login. You can revoke it anytime.

**Q: Is the client share link secure?**
A: It's a revocable UUID with a configurable scope. Treat it like a shared link and revoke if you suspect leakage.

## Technical

**Q: Which database does it use?**
A: Neon PostgreSQL via Prisma. Local development uses Docker Postgres 16.

**Q: How are migrations handled?**
A: Via Prisma migrations (`pnpm db:migrate`). Never hand-edit migration SQL.

**Q: Where are secrets stored?**
A: `~/.secrets/` (restricted permissions), sourced via `~/.secrets/env`. Never in the repository.

**Q: Can I self-host?**
A: Yes — Docker Compose is provided. Vercel is the recommended managed deployment.

## Troubleshooting

**Q: I can't see a project I was invited to.**
A: Make sure you accepted the invitation and are signed in with the same email address. Contact the project owner to verify your membership.

**Q: OAuth sign-in button is missing.**
A: The provider's `*_ID` and `*_SECRET` environment variables must both be set.

**Q: Migrations fail with "prepared statement already exists".**
A: You're using the pooled connection string for migrations. Use `DATABASE_URL_UNPOOLED` (direct connection) for `prisma migrate`.
