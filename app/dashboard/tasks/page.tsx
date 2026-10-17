import { AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectAccessWhere } from '@/lib/permissions';
import { formatDate, formatRelativeDate } from '@/lib/utils';

import { AutoPopulateProjects } from './auto-populate';

export default async function TasksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const tasks = await db.task.findMany({
    where: {
      OR: [{ assigneeId: userId }, { reporterId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { name: true, slug: true } },
      assignee: { select: { name: true, email: true } },
    },
  });

  // Projects that have been "populated" with git data (commits/branches) via
  // GitHub sync or the local scanner, and that the current user can access.
  const populatedProjects = userId
    ? await db.project.findMany({
        where: {
          AND: [
            projectAccessWhere(userId),
            { OR: [{ gitCommits: { some: {} } }, { branches: { some: {} } }] },
          ],
        },
        orderBy: { lastActivityAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { gitCommits: true, branches: true, tasks: true } },
        },
      })
    : [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'BLOCKED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'IN_REVIEW':
        return 'outline';
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">All your tasks across projects</p>
      </div>

      {populatedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-populate from projects</CardTitle>
            <CardDescription>
              Create tasks from recent commits and branches in your populated projects. Commits and
              branches that already have a task are skipped, so it is safe to run more than once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoPopulateProjects projects={populatedProjects} />
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No tasks yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tasks will appear here when they are assigned to you.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {statusIcon(task.status)}
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project.name} · {task.assignee?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Due date when set, otherwise when the task was created. */}
                  <span
                    className={`text-xs ${
                      task.dueDate && task.dueDate < new Date() && task.status !== 'DONE'
                        ? 'font-medium text-red-500'
                        : 'text-muted-foreground'
                    }`}
                    title={task.dueDate ? 'Due date' : 'Created'}
                  >
                    {task.dueDate ? formatDate(task.dueDate) : formatRelativeDate(task.createdAt)}
                  </span>
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                  <Badge variant="outline">{task.priority}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
