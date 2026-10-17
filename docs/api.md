# API / Server Actions Reference

ProjectHub

**Version:** 1.0  
**Status:** Draft  
**Last updated:** 2026-10-17  
**Owner:** Engineering

---

## Conventions

- Mutations are Next.js Server Actions (`'use server'`).
- Every action begins with `auth()`; unauthenticated → `redirect('/login')`.
- Authorization uses `lib/permissions.ts` (`requireProjectAccess`, `requireProjectRole`, `requireTaskAccess`).
- On success: `revalidatePath(...)` + `redirect(...)` or return `{ ok: true }`.
- On failure: return `{ error: string }` (displayed as toast) or throw `Error('Forbidden')`.
- Zod validation is applied in `lib/validators/` (planned per domain).

---

## Projects (`lib/actions/projects.ts`)

### createProject(formData)

- Inputs: `name`, `description`, `path`, `repositoryUrl`
- Auth: required
- Creates project with `ownerId = session.user.id`; slug auto-generated
- Redirects to `/dashboard/projects/[slug]`
- Errors: missing name/path; duplicate slug

### deleteProject(projectId)

- Auth: required + `requireProjectAccess`
- Hard-deletes project (cascades members, tasks, etc.)
- Redirects to `/dashboard/projects`

---

## Members (`lib/actions/members.ts`) — planned

### inviteMember({ projectId, email, role })

- Auth: required + `requireProjectRole(..., ADMIN)`
- Role cannot be OWNER; only OWNER may invite ADMIN
- Existing user → `ProjectMember` + Notification + ActivityLog
- New email → `ProjectInvitation` (hashed token, 7-day expiry) + email/link
- Returns `{ error }` or `{ ok: true }`

### acceptInvitation(token)

- Resolves hashed token → valid, unaccepted, non-expired invitation matching session email
- Creates `ProjectMember`; marks invitation accepted
- Notifies inviter + ActivityLog
- Redirects to project page

### revokeInvitation(invitationId)

- Auth: ADMIN+ on project
- Deletes pending invitation

### removeMember({ projectId, userId })

- Auth: ADMIN+
- Cannot remove project owner; cannot self-remove if last owner

### changeMemberRole({ projectId, userId, role })

- Auth: OWNER for ADMIN role; ADMIN for MEMBER/VIEWER

### generateClientShareToken({ projectId })

- Auth: ADMIN+
- Sets `ProjectSettings.clientShareToken` (UUID); default scope

### revokeClientShareToken({ projectId })

- Auth: ADMIN+
- Sets `clientShareToken = null`

### updateClientShareScope({ projectId, scope })

- Auth: ADMIN+
- Merges scope JSON (tasks, git, deployments, notes)

---

## Tasks (`lib/actions/tasks.ts`)

### createTask(formData)

- Inputs: `title`, `description`, `status`, `priority`, `assigneeId`, `dueDate`, `projectId`
- Auth: required + project write access (MEMBER+)

### updateTask({ id, ...fields })

- Auth: required + `requireTaskAccess`

### deleteTask(taskId)

- Auth: required + project write access

---

## GitHub (`lib/actions/github.ts`)

### importRepositories()

- Auth: required + GitHub OAuth connected
- Imports repos as projects (path = local clone, repositoryUrl set)

---

## API routes

| Route                                 | Method   | Auth          | Purpose                           |
| ------------------------------------- | -------- | ------------- | --------------------------------- |
| `app/api/auth/[...path]/route.ts`     | GET/POST | No (NextAuth) | Sign-in/callback                  |
| `app/api/scan/route.ts`               | POST     | Yes           | Trigger local project scan        |
| `app/api/projects/route.ts`           | GET      | Yes           | List accessible projects          |
| `app/api/invitations/accept/route.ts` | GET      | Yes           | Accept invite via token (planned) |

---

## Rate limits (planned)

- Invite endpoints: per-IP + per-user window
- Client share token routes: per-token (e.g., 100 req/min)
- Scan endpoint: per-user to prevent abuse

---

## Errors

| Condition               | Response                                  |
| ----------------------- | ----------------------------------------- |
| Unauthenticated         | `redirect('/login')`                      |
| Forbidden (role)        | `Error('Forbidden')` → 403 UI toast       |
| Not found               | `notFound()` → 404                        |
| Validation error        | `{ error: '...' }`                        |
| DB constraint violation | `{ error: '...' }` (e.g., duplicate slug) |
