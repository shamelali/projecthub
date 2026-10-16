'use client';

import { useState } from 'react';
import { Check, FolderGit2, GitBranch, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ScannedProject {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch?: string;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  remotes?: string[];
}

export function ScanProjectsClient() {
  const [path, setPath] = useState('/home/user/projects');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ScannedProject[]>([]);
  const [scanned, setScanned] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      setProjects(data.projects || []);
      setScanned(true);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (project: ScannedProject) => {
    setAdding(project.path);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          path: project.path,
          repositoryUrl: project.remotes?.[0] || '',
        }),
      });
      if (res.ok) {
        setAdded((prev) => new Set(prev).add(project.path));
      }
    } catch (err) {
      console.error('Failed to add project:', err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan for Projects</h1>
        <p className="text-muted-foreground">Scan a local directory to discover Git repositories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/projects"
              className="flex-1"
            />
            <Button onClick={handleScan} disabled={loading}>
              <Search />
              {loading ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {scanned && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Found {projects.length} project{projects.length !== 1 ? 's' : ''}
          </h2>
          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No Git repositories found in {path}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Card key={project.path}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <FolderGit2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.path}</p>
                        {project.branch && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            <span>{project.branch}</span>
                            {project.lastCommit && (
                              <span className="truncate max-w-xs">
                                — {project.lastCommit.message}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {added.has(project.path) ? (
                        <Badge variant="default">
                          <Check />
                          Added
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddProject(project)}
                          disabled={adding === project.path}
                        >
                          <Plus />
                          {adding === project.path ? 'Adding...' : 'Add'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
