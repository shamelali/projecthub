# ProjectHub

A full-stack project management platform for developers, teams, and clients. Provides a unified dashboard to discover, track, and manage software projects across local filesystems, Git repositories, CI/CD pipelines, and AI coding sessions.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Neon PostgreSQL + Prisma ORM
- **Auth:** NextAuth v5 (GitHub, GitLab, Credentials)
- **Real-time:** Supabase Realtime
- **Git:** simple-git (local), GitHub/GitLab REST API (remote)
- **Package Manager:** pnpm
- **Deployment:** Vercel (primary), Docker (self-host)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (via corepack: `corepack enable pnpm`)
- Neon PostgreSQL database
- Supabase project (for Realtime)
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

| Variable                        | Description                                                   | Required |
| ------------------------------- | ------------------------------------------------------------- | -------- |
| `DATABASE_URL`                  | Neon PostgreSQL connection string                             | Yes      |
| `NEXTAUTH_SECRET`               | Secret for NextAuth (generate with `openssl rand -base64 32`) | Yes      |
| `NEXTAUTH_URL`                  | Base URL of your application                                  | Yes      |
| `GITHUB_ID`                     | GitHub OAuth client ID                                        | No*      |
| `GITHUB_SECRET`                 | GitHub OAuth client secret                                    | No*      |
| `GITLAB_ID`                     | GitLab OAuth client ID                                        | No*      |
| `GITLAB_SECRET`                 | GitLab OAuth client secret                                    | No*      |
| `DEMO_EMAIL`                    | Development/test-only credentials login email                 | No       |
| `DEMO_PASSWORD`                 | Development/test-only credentials login password              | No       |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                          | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key                                        | Yes      |
| `VERCEL_TOKEN`                  | Vercel API token for deployment tracking                      | No       |
| `NEXT_PUBLIC_APP_URL`           | Public app URL (defaults to NEXTAUTH_URL)                     | No       |

*OAuth buttons are available only when both credentials for that provider are configured. Credentials login is available only outside production when both `DEMO_EMAIL` and `DEMO_PASSWORD` are configured.

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
│   ├── auth/              # NextAuth config, permissions
│   ├── db/                # Prisma client, extensions
│   ├── git/               # Git scanner, operations
│   ├── realtime/          # Supabase Realtime client
│   ├── mcp/               # MCP client, OpenCode
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

- [ ] Real-time sync (Supabase Realtime)
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
