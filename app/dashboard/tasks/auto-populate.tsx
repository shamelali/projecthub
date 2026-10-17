'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { populateTasksFromProject } from '@/lib/actions/tasks';

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  _count: { gitCommits: number; branches: number; tasks: number };
}

type Status = 'idle' | 'populating' | 'success' | 'error';

interface AutoPopulateProjectsProps {
  projects: ProjectRow[];
}

export function AutoPopulateProjects({ projects }: AutoPopulateProjectsProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const handlePopulate = async (project: ProjectRow) => {
    // Let Next.js redirects (e.g. session expired) propagate instead of being
    // swallowed as an error message.
    try {
      const result = await populateTasksFromProject(project.id);
      if (result.error) {
        setStatuses((s) => ({ ...s, [project.id]: 'error' }));
        setMessages((m) => ({ ...m, [project.id]: result.error }));
        return;
      }
      setStatuses((s) => ({ ...s, [project.id]: 'success' }));
      setMessages((m) => ({
        ...m,
        [project.id]: `Added ${result.created} task(s) from “${project.name}”.`,
      }));
      router.refresh();
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
      ) {
        throw error;
      }
      setStatuses((s) => ({ ...s, [project.id]: 'error' }));
      setMessages((m) => ({
        ...m,
        [project.id]: error instanceof Error ? error.message : 'Failed to populate tasks.',
      }));
    }
  };

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const status = statuses[project.id] ?? 'idle';
        const message = messages[project.id];
        const populating = status === 'populating';

        return (
          <div key={project.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-input bg-muted/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-medium truncate">{project.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    /dashboard/projects/{project.slug}
                  </span>
                </div>
                <div className="flex gap-1 text-xs text-muted-foreground">
                  <span>{project._count.gitCommits} commits</span>
                  <span>·</span>
                  <span>{project._count.branches} branches</span>
                  <span>·</span>
                  <span>{project._count.tasks} existing tasks</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                <Button
                  onClick={() => handlePopulate(project)}
                  disabled={populating}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  {populating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Populating…
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add tasks
                    </>
                  )}
                </Button>
              </div>
            </div>
            {message && (
              <p
                className={`px-3 pb-2 text-xs ${
                  status === 'success' ? 'text-green-900' : 'text-destructive'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
