import Link from 'next/link';
import { FolderGit2, Plus, Search } from 'lucide-react';

import { GitHubImportButton } from '@/components/github-import';
import { ImportLocalButton } from '@/components/import-local';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectAccessWhere } from '@/lib/permissions';
import { formatRelativeDate } from '@/lib/utils';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const projects = await db.project.findMany({
    where: {
      AND: [
        session?.user?.id ? projectAccessWhere(session.user.id) : { id: '' },
        // Case-insensitive substring across name, slug and description. The
        // filter composes with the access filter, so a search can never widen
        // visibility.
        query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
    orderBy: { lastActivityAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your development projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus />
            New Project
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <GitHubImportButton className="w-auto" />
          <ImportLocalButton />
        </div>
      </div>

      {/* Plain GET form: no client JS needed, and ?q= URLs are shareable. */}
      <form action="/dashboard/projects" method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search projects..."
          className="pl-10"
        />
      </form>

      {projects.length === 0 && query ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No projects match “{query}”</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different name or{' '}
            <Link href="/dashboard/projects" className="text-primary hover:underline">
              clear the search
            </Link>
            .
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first project to get started.
          </p>
          <Link href="/dashboard/projects/new" className="mt-4 inline-block">
            <Button>
              <Plus />
              Add Project
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Or import your repositories from GitHub — or a local folder.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <GitHubImportButton className="w-auto" />
            <ImportLocalButton />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <FolderGit2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{project.slug}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{project._count.tasks} tasks</span>
                    {project.techStack.length > 0 && (
                      <span>{project.techStack.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                  {/* lastActivityAt moves with task changes (server actions),
                      GitHub pushes (imports + the daily /api/cron/sync-git job),
                      and is only ever moved forward. */}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last activity {formatRelativeDate(project.lastActivityAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
