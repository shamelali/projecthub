'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { moveTask } from '@/lib/actions/tasks';

import { TaskCard } from './task-card';

interface KanbanBoardProps {
  projectId: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    position: number;
    assignee?: { name: string | null } | null;
    dueDate?: Date | string | null;
    startedAt?: Date | string | null;
  }>;
}

const columns = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-gray-400' },
  { id: 'TODO', label: 'To Do', color: 'bg-blue-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-400' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-purple-400' },
  { id: 'DONE', label: 'Done', color: 'bg-green-500' },
];

export function KanbanBoard({ projectId, tasks }: KanbanBoardProps) {
  const router = useRouter();

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const columnTasks = tasks.filter((t) => t.status === status);
    await moveTask(taskId, status, columnTasks.length);
    router.refresh();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = tasks
          .filter((t) => t.status === column.id)
          .sort((a, b) => a.position - b.position);

        return (
          <div
            key={column.id}
            className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <span className="text-sm font-medium">{column.label}</span>
                <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  router.push(`/dashboard/tasks/new?projectId=${projectId}&status=${column.id}`)
                }
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 space-y-2 p-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskCard task={task} />
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
