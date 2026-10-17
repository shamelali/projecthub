'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, RotateCcw, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { moveTask } from '@/lib/actions/tasks';

interface QuickActionsProps {
  taskId: string;
  status: string;
  position: number;
}

/**
 * One-click status changes matching the suggested next step. Reopening a DONE
 * task passes through moveTask, which clears completedAt.
 */
const NEXT_ACTIONS: Record<
  string,
  Array<{ label: string; to: string; icon: typeof ArrowRight; variant?: 'default' | 'outline' }>
> = {
  BACKLOG: [{ label: 'Promote to TODO', to: 'TODO', icon: ArrowRight }],
  TODO: [{ label: 'Start', to: 'IN_PROGRESS', icon: ArrowRight }],
  IN_PROGRESS: [
    { label: 'Move to review', to: 'IN_REVIEW', icon: ArrowRight, variant: 'outline' },
    { label: 'Mark done', to: 'DONE', icon: CheckCircle2 },
  ],
  IN_REVIEW: [{ label: 'Mark done', to: 'DONE', icon: CheckCircle2 }],
  BLOCKED: [{ label: 'Unblock', to: 'TODO', icon: Unlock, variant: 'outline' }],
  DONE: [{ label: 'Reopen', to: 'TODO', icon: RotateCcw, variant: 'outline' }],
};

export function TaskQuickActions({ taskId, status, position }: QuickActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [moved, setMoved] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[status] ?? [];
  if (actions.length === 0) return null;

  const run = (label: string, to: string) => {
    setMoved(label);
    startTransition(async () => {
      await moveTask(taskId, to, position);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map(({ label, to, icon: Icon, variant }) => (
        <Button
          key={label}
          size="sm"
          variant={variant ?? 'default'}
          disabled={pending}
          onClick={() => run(label, to)}
        >
          <Icon className="h-4 w-4" />
          {pending && moved === label ? 'Saving…' : label}
        </Button>
      ))}
    </div>
  );
}
