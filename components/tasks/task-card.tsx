'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { deleteTask } from '@/lib/actions/tasks';
import { priorityBadgeVariant } from '@/lib/task-status';
import { formatDate, formatRelativeDate } from '@/lib/utils';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee?: { name: string | null } | null;
    dueDate?: Date | string | null;
    startedAt?: Date | string | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    await deleteTask(task.id);
    router.refresh();
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = Boolean(dueDate && dueDate < new Date() && task.status !== 'DONE');

  return (
    <Card className="group relative">
      {/* Stretched link: the whole card opens the detail page, while the
          delete button stays above the overlay (z-10). */}
      <Link
        href={`/dashboard/tasks/${task.id}`}
        className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="sr-only">Open task: {task.title}</span>
      </Link>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {task.assignee?.name || 'Unassigned'}
          </span>
          <Badge variant={priorityBadgeVariant(task.priority)} className="text-[10px]">
            {task.priority}
          </Badge>
        </div>
        {(dueDate || task.startedAt) && (
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            {dueDate && (
              <span
                className={overdue ? 'font-medium text-red-500' : 'text-muted-foreground'}
                title="Due date"
              >
                Due {formatDate(dueDate)}
              </span>
            )}
            {!dueDate && task.startedAt && (
              <span className="text-muted-foreground" title="Date the work happened">
                {formatRelativeDate(task.startedAt)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
