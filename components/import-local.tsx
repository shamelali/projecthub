'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderInput, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { importLocalProjects } from '@/lib/actions/projects';
import { buildLocalImports, extractOriginUrl } from '@/lib/local-import';

type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

/**
 * "Import From Local": picks a folder in the browser, detects git repositories
 * at its top level, extracts origin URLs from `.git/config`, and sends only
 * metadata to the server. The scan runs client-side because neither host has
 * a filesystem; file contents never leave the browser except the ~1KB
 * `.git/config` text needed for the origin URL.
 */
export function ImportLocalButton({ className }: { className?: string } = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [message, setMessage] = useState('');

  // `webkitdirectory` is non-standard, so it is set imperatively — TypeScript
  // has no JSX prop for it.
  const setInputAttrs = (el: HTMLInputElement | null) => {
    if (el) {
      el.setAttribute('webkitdirectory', '');
      el.setAttribute('directory', '');
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setStatus('importing');
    setMessage('');
    try {
      const all = Array.from(fileList);
      const entries = all.map((file) => ({
        path: file.webkitRelativePath || file.name,
        lastModified: file.lastModified,
      }));

      const items = buildLocalImports(entries);
      if (items.length === 0) {
        setStatus('error');
        setMessage('No git repositories found in the selected folder.');
        return;
      }

      const fileByPath = new Map(all.map((file) => [file.webkitRelativePath || file.name, file]));
      const payload = await Promise.all(
        items.map(async (item) => {
          let repositoryUrl: string | null = null;
          const configFile = item.configPath ? fileByPath.get(item.configPath) : undefined;
          if (configFile) {
            try {
              repositoryUrl = extractOriginUrl(await configFile.text());
            } catch {
              // Unreadable config → import without an origin URL.
            }
          }
          return {
            name: item.name,
            relativePath: item.relativePath,
            repositoryUrl,
            lastActivityAt: item.lastActivityAt,
          };
        })
      );

      const result = await importLocalProjects(payload);
      if ('error' in result) {
        setStatus('error');
        setMessage(result.error);
        return;
      }
      setStatus('success');
      setMessage(
        `Imported ${result.imported} project${result.imported === 1 ? '' : 's'} from your folder (${result.created} new).`
      );
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Import failed.');
    }
  };

  const importing = status === 'importing';

  return (
    <div className={className}>
      <input
        ref={(el) => {
          inputRef.current = el;
          setInputAttrs(el);
        }}
        type="file"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const files = event.target.files;
          if (files && files.length > 0) void handleFiles(files);
          event.target.value = '';
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={importing} className="w-full">
        {importing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning folder…
          </>
        ) : (
          <>
            <FolderInput className="h-4 w-4" />
            Import From Local
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
