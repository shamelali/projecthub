# ProjectHub

A full-stack project management platform for developers, teams, and clients. Provides a unified dashboard to discover, track, and manage software projects across local filesystems, Git repositories, CI/CD pipelines, and AI coding sessions.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Neon PostgreSQL + Prisma ORM
- **Auth:** Better Auth (email + password, GitHub & GitLab OAuth, email verification)
- **Git:** GitHub/GitLab REST API (repository sync, commit/branch activity)
- **Email:** Brevo HTTP API (verification & password reset)
- **Monitoring:** Sentry (errors, source maps, cron & release health)
- **Package Manager:** pnpm
- **Deployment:** Cloudflare Workers (primary, via OpenNext), Vercel (mirror)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (via corepack: `corepack enable pnpm`)
- Neon PostgreSQL database
- Brevo account (for email sending)
- GitHub/GitLab OAuth apps (for authentication)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd projecthub

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name init

# Start development server
pnpm dev
```

### Environment Variables

| Variable                                | Description                                                | Required |
| --------------------------------------- | ---------------------------------------------------------- | -------- |
| `DATABASE_URL`                          | Neon **pooled** connection string (runtime queries)        | Yes      |
| `DATABASE_URL_UNPOOLED`                 | Neon direct endpoint (Prisma `directUrl`, migrations)      | Yes      |
| `BETTER_AUTH_SECRET`                    | Auth secret (generate with `openssl rand -base64 32`)      | Yes      |
| `BETTER_AUTH_URL`                       | Base URL of this deployment (auth callbacks & email links) | Yes      |
| `BETTER_AUTH_TRUSTED_ORIGINS`           | Comma-separated extra origins allowed for auth redirects   | No       |
| `GITHUB_ID` / `GITHUB_SECRET`           | GitHub OAuth app credentials                               | No*      |
| `GITLAB_ID` / `GITLAB_SECRET`           | GitLab OAuth app credentials                               | No*      |
| `DEMO_MODE` / `DEMO_PASSWORD`           | Enable the demo account; leave unset in production         | No       |
| `DEMO_EMAIL`                            | Demo account address (defaults to `demo@projecthub.dev`)   | No       |
| `BREVO_API_KEY`                         | Brevo API key — email sending (required in production)     | Prod     |
| `EMAIL_FROM` / `EMAIL_FROM_NAME`        | Verified Brevo sender for outgoing mail                    | Prod     |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSNs (server / browser)                             | Prod     |
| `SENTRY_AUTH_TOKEN`                     | Sentry token — uploads source maps at build time           | Prod     |
| `SENTRY_ORG` / `SENTRY_PROJECT`         | Sentry slugs used when uploading source maps               | Prod     |
| `CRON_SECRET`                           | Bearer secret for the daily `/api/cron/sync-git` job       | Prod     |

*OAuth buttons appear only when both credentials for a provider are set. The demo account exists and can sign in only when `DEMO_MODE="true"`.

Full list with comments: `.env.example`. On Cloudflare Workers, non-secret vars live in `wrangler.jsonc` and secrets in `wrangler secret put`.

## Project Structure

```
projecthub/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, callback)
│   ├── dashboard/         # Protected dashboard routes
│   ├── (client)/          # Client portal routes
│   ├── api/               # API route handlers
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Auth components
│   ├── projects/          # Project components
│   ├── tasks/             # Task/Kanban components
│   ├── git/               # Git components
│   ├── deployments/       # Deployment components
│   ├── sessions/          # AI session components
│   ├── mcp/               # MCP server components
│   ├── notes/             # Notes components
│   ├── notifications/     # Notification components
│   ├── settings/          # Settings components
│   └── realtime/          # Real-time components
├── lib/                   # Shared utilities
│   ├── auth.ts / auth-server.ts  # Better Auth setup & accessors
│   ├── db.ts              # Prisma client (Hyperdrive-aware on Workers)
│   ├── github.ts          # GitHub sync (repos, branches, commits)
│   ├── theme.ts           # Theme resolution for the root layout
│   ├── suggest-next-step.ts      # Task suggestion engine
│   ├── actions/           # Server Actions
│   ├── validators/        # Zod schemas
│   ├── utils/             # Utility functions
│   └── features/          # Feature flags
├── prisma/                # Prisma schema & migrations
├── public/                # Static assets
├── tests/                 # Unit & integration tests
├── scripts/               # Build/seed scripts
└── .github/workflows/     # CI/CD pipelines
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma migrate dev  # Run migrations in development
pnpm prisma migrate deploy  # Run migrations in production
pnpm prisma studio    # Open Prisma Studio
pnpm db:seed          # Seed database with demo data

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Open Vitest UI
pnpm e2e              # Run E2E tests (Playwright)
pnpm e2e:ui           # Open Playwright UI

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format with Prettier
pnpm typecheck        # Run TypeScript type checking

# Docker
docker compose up -d  # Start self-hosted stack
docker compose down   # Stop self-hosted stack
```

## Features

### MVP v0.1 (Current)

- [x] Project dashboard with grid/list views
- [x] Git repository scanner (local)
- [x] Git remote sync (GitHub/GitLab)
- [x] Kanban board with drag-and-drop
- [x] Authentication (GitHub, GitLab, Credentials)
- [x] Role-based access control
- [x] Quick actions (VS Code, Terminal, Browser)

### MVP v0.2 (Planned)

- [ ] GitHub webhooks for instant activity updates (daily cron covers polling today)
- [ ] Deployment tracking (Vercel, Netlify, Cloudflare)
- [ ] OpenCode session tracking
- [ ] MCP server management
- [ ] Project notes (Markdown editor)

### Post-MVP

- [ ] Time tracking
- [ ] Gantt view
- [ ] Client portal
- [ ] Team workspaces
- [ ] Mobile PWA
- [ ] Desktop app

## Deployment

### Vercel (Recommended)

1. Push to GitHub/GitLab
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker (Self-hosted)

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f app
```

See [docs/deployment.md](docs/deployment.md) for detailed guides.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

MIT License - see [LICENSE](LICENSE) for details.
