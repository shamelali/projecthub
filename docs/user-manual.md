# User Manual

ProjectHub — Project Management Platform

**Version:** 1.0  
**Status:** Draft  
**Last updated:** 2026-10-17  
**Owner:** Product

---

## 1. Getting started

1. Go to the application URL and sign in (GitHub, GitLab, or credentials).
2. From the dashboard, click **New Project** to add a project from a local path or Git repository URL.
3. Projects you own or are invited to appear on your dashboard with open/completed task counts.

---

## 2. Projects

### Create a project
- Click **New Project** on the dashboard.
- Enter name, optional description, absolute filesystem path, and optional Git repository URL.
- A slug is generated automatically from the name.
- Click **Create**.

### Edit a project
- Open the project → **Settings**.
- Update name, description, path, repository URL, status, or visibility.
- Visibility options: `PRIVATE` (only you and members), `TEAM`, `PUBLIC`, `CLIENT`.

### Archive or delete
- Archive sets status to `ARCHIVED` (keeps data, hides from active views).
- Delete removes the project and all related data (tasks, members, notes, logs).

---

## 3. Tasks & Kanban board

- Open a project → **Task Board**.
- Create tasks with title, description, status, priority, assignee, and due date.
- Drag tasks between columns: Backlog → Todo → In Progress → In Review → Done → Blocked.
- Task order within a column is preserved (drag to reorder).
- Add subtasks and comments on individual tasks.

---

## 4. Sharing with teammates

### Invite a member
1. Open the project → **Settings → Members**.
2. Click **Invite member**, enter a teammate's email, and choose a role:
   - **Owner** — full control (only project owners can assign this)
   - **Admin** — manage members and settings
   - **Member** — create/edit tasks, view board
   - **Viewer** — read-only access
3. If the person already has an account, they're added immediately.
4. Otherwise, an invitation is created (valid 7 days). They can accept it after signing up.

### Manage members
- Change a member's role (owners/admins only).
- Remove a member (cannot remove the project owner; cannot remove yourself if you're the last owner).
- Revoke pending invitations at any time.

### Share with clients / stakeholders (read-only)
1. Open the project → **Settings → Client access**.
2. Click **Generate share link**. A read-only URL is created (e.g., `/c/<token>/projects/<slug>`).
3. Copy and send the link to a client. No login required.
4. Configure what the client can see: tasks, Git, deployments, notes.
5. **Revoke** the link anytime to cut off access.

---

## 5. Git & metadata

- Project path is scanned for Git commits, branches, and remotes.
- View recent commits and branch status on the project page.
- Connect GitHub/GitLab to import repositories automatically.

---

## 6. Settings

- **Profile:** name, email, role.
- **Appearance:** theme (light/dark/system), default view (grid/list/table).
- **Notifications:** email and push toggles.
- **Security:** two-factor auth (planned), active sessions.

---

## 7. Tips

- Use the search bar on the projects page to find projects by name or slug.
- Quick actions on each project card: open in VS Code, Terminal, or Browser.
- Client share links are revocable — treat them like shared passwords and rotate if leaked.
