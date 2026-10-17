'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { syncProjectGitDataAction } from '@/lib/actions/github';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function GitHubSyncButton({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setStatus('syncing');
    setMessage('');

    const result = await syncProjectGitDataAction(projectId);
    if ('error' in result) {
      setStatus('error');
      setMessage(result.error);
      return;
    }

    setStatus('success');
    setMessage(`Synced ${result.branches} branches and ${result.commits} commits`);
    router.refresh();
  };

  const syncing = status === 'syncing';

  return (
    <div className="space-y-2">
      <Button onClick={handleSync} disabled={syncing} className={`w-full ${className ?? ''}`}>
        {syncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync from GitHub
          </>
        )}
      </Button>
      {status === 'success' && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-900">{message}</div>
      )}
      {status === 'error' && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
      )}
    </div>
  );
}
