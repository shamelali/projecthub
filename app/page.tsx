import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';

/** Only features that actually exist in the app today. */
const features = [
  {
    icon: LayoutDashboard,
    title: 'Unified dashboard',
    description:
      'Every project you own or share, with open task counts and recent activity, on one screen.',
  },
  {
    icon: Search,
    title: 'Filesystem scanner',
    description:
      'On your own machine, point ProjectHub at a directory and it discovers the git repositories inside.',
  },
  {
    icon: ListChecks,
    title: 'Kanban task board',
    description:
      'Drag work across Backlog, In progress, Review and Done. Blockers are called out, not buried.',
  },
  {
    icon: GitBranch,
    title: 'Repository context',
    description:
      'Each project keeps its path and remote repository alongside its tasks, so the code is one click away.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Solo, team, admin and read-only client roles decide who can see and change what.',
  },
  {
    icon: Users,
    title: 'Sign-in your way',
    description:
      'Email and password out of the box, with GitHub and GitLab single sign-on when configured.',
  },
];

const steps = [
  {
    title: 'Create your account',
    description: 'Sign up with an email and password, or connect a GitHub or GitLab identity.',
  },
  {
    title: 'Add your projects',
    description: 'Create them by hand, or scan a directory to find the repositories for you.',
  },
  {
    title: 'Track the work',
    description:
      'Break projects into tasks, move them across the board, and watch activity in one place.',
  },
];

export default async function LandingPage() {
  const session = await auth();

  const primaryHref = session ? '/dashboard' : '/login';
  const primaryLabel = session ? 'Go to dashboard' : 'Get started';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5" />
            ProjectHub
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.user.name || session.user.email}
                </span>
                <Button asChild size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/login">{primaryLabel}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="container flex flex-col items-center py-20 text-center md:py-28">
          <Badge variant="secondary" className="mb-6">
            Project &amp; task management for developers
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Every project and every task, in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            ProjectHub brings your local git repositories, remote remotes and task boards together
            behind a single dashboard — so you always know what is in flight and what is stuck.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Email and password sign-up takes about thirty seconds.
          </p>
        </section>

        <section id="features" className="border-t bg-muted/30 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Built for the whole workflow</h2>
              <p className="mt-4 text-muted-foreground">
                From discovering a repository on disk to closing the last ticket, without switching
                tools.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <feature.icon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Up and running in three steps</h2>
              <p className="mt-4 text-muted-foreground">
                No infrastructure to stand up and no services to configure before you start.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title}>
                  <CardHeader>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                      {index + 1}
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container">
            <Card className="mx-auto max-w-3xl">
              <CardHeader className="items-center text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground" />
                <CardTitle className="text-2xl">Start tracking your work today</CardTitle>
                <CardDescription className="text-base">
                  Create an account and bring your first project across. It takes less time than
                  reading this page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild size="lg">
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <FolderGit2 className="h-4 w-4" />
            ProjectHub
          </div>
          <p>Project and task management for developers.</p>
        </div>
      </footer>
    </div>
  );
}
