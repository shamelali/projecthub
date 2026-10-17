'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { importGitHubRepositories } from '@/lib/actions/github';

type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

/**
 * Client-side trigger for importing a signed-in GitHub user's repositories as
 * projects. Used both as a one-time onboarding prompt and as a manual refresh.
 */
export function GitHubImportButton({ className }: { className?: string } = {}) {
  const router = useRouter();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    setStatus('importing');
    setMessage('');

    const result = await importGitHubRepositories();
    if ('error' in result) {
      setStatus('error');
      setMessage(result.error);
      return;
    }

    setStatus('success');
    setMessage(`Imported ${result.imported} of ${result.total} repositories`);
    router.refresh();
  };

  const importing = status === 'importing';

  return (
    <div className="space-y-2">
      <Button onClick={handleImport} disabled={importing} className={`w-full ${className ?? ''}`}>
        {importing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Import from GitHub
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
