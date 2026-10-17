import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  Lightbulb,
  User,
} from 'lucide-react';

import { TaskQuickActions } from '@/components/tasks/task-quick-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateTask } from '@/lib/actions/tasks';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireTaskAccess } from '@/lib/permissions';
import { suggestNextStep } from '@/lib/suggest-next-step';
import { formatDate, formatRelativeDate } from '@/lib/utils';

const priorityVariant = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'destructive';
    case 'HIGH':
      return 'default';
    case 'MEDIUM':
      return 'secondary';
    default:
      return 'outline';
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

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  // Same access rule as the task server actions — a task is visible through
  // its project's membership.
  try {
    await requireTaskAccess(session.user.id, taskId);
  } catch {
    notFound();
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { name: true, slug: true, repositoryUrl: true } },
      assignee: { select: { name: true, email: true } },
      reporter: { select: { name: true, email: true } },
    },
  });
  if (!task) notFound();

  const suggestion = suggestNextStep(task);
  const commitSha = suggestion.relatedSha;
  const commitUrl =
    commitSha && task.project.repositoryUrl
      ? `${task.project.repositoryUrl}/commit/${commitSha}`
      : null;

  const meta = [
    { label: 'Assignee', value: task.assignee?.name ?? 'Unassigned', icon: User },
    { label: 'Reporter', value: task.reporter?.name ?? '—', icon: User },
    { label: 'Created', value: formatRelativeDate(task.createdAt), icon: CalendarDays },
    ...(task.dueDate
      ? [{ label: 'Due', value: formatDate(task.dueDate), icon: CalendarDays }]
      : []),
    ...(task.startedAt
      ? [{ label: 'Started', value: formatRelativeDate(task.startedAt), icon: CalendarDays }]
      : []),
    ...(task.completedAt
      ? [{ label: 'Completed', value: formatRelativeDate(task.completedAt), icon: CalendarDays }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tasks
        </Link>
        <Link href={`/dashboard/projects/${task.project.slug}`}>
          <Button variant="outline" size="sm">
            Open project board
          </Button>
        </Link>
      </div>

      {/* The suggestion leads the page — it is the reason this view exists. */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <CardTitle className="text-base">Suggested next step</CardTitle>
            <p className="mt-1 text-sm font-medium">{suggestion.headline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{suggestion.reason}</p>
            <div className="mt-3">
              <TaskQuickActions taskId={task.id} status={task.status} position={task.position} />
            </div>
            {commitUrl && commitSha && (
              <a
                href={commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <GitCommitHorizontal className="h-3.5 w-3.5" />
                View commit {commitSha.slice(0, 7)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {!commitUrl && suggestion.relatedBranch && (
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                {suggestion.relatedBranch}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
            <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
          </div>
          <CardTitle className="text-xl leading-snug">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {meta.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>

          {task.description && (
            <div>
              <h3 className="mb-1 text-sm font-medium">Description</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description}
              </p>
            </div>
          )}

          {/* Partial update on purpose: only dueDate is sent, and updateTask
              leaves every absent field untouched. */}
          <form action={updateTask.bind(null, task.id)} className="flex items-end gap-2">
            <div className="space-y-1">
              <label htmlFor="dueDate" className="text-sm font-medium">
                Due date
              </label>
              <Input
                type="date"
                id="dueDate"
                name="dueDate"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
                className="w-44"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Save
            </Button>
          </form>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-mono text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
