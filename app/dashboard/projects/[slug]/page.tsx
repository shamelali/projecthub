import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, FolderGit2, GitBranch } from 'lucide-react';

import { KanbanBoard } from '@/components/tasks/kanban-board';
import { NewTaskForm } from '@/components/tasks/new-task-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectAccessWhere } from '@/lib/permissions';

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const project = await db.project.findFirst({
    where: {
      slug,
      ...(session?.user?.id ? projectAccessWhere(session.user.id) : { id: '' }),
    },
    include: {
      tasks: {
        orderBy: { position: 'asc' },
        include: { assignee: { select: { name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) notFound();

  const openTasks = project.tasks.filter((t) => t.status !== 'DONE').length;
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
            <FolderGit2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">{project.description || 'No description'}</p>
          </div>
        </div>
        <Badge variant="secondary">{project.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project._count.tasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Task Board</h2>
          <div className="w-64">
            <NewTaskForm projectId={project.id} />
          </div>
        </div>
        <KanbanBoard projectId={project.id} tasks={project.tasks} />
      </div>

      {project.repositoryUrl && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Repository</h2>
          <a
            href={project.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {project.repositoryUrl}
          </a>
        </div>
      )}
    </div>
  );
}
