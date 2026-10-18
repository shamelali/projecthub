'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { uniqueSlug } from '@/lib/github';
import { requireProjectAccess } from '@/lib/permissions';

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const path = formData.get('path') as string;
  const repositoryUrl = formData.get('repositoryUrl') as string;

  if (!name || !path) return { error: 'Name and path are required' };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) return { error: 'A project with this name already exists' };

  const project = await db.project.create({
    data: {
      name,
      slug,
      description: description || null,
      path,
      repositoryUrl: repositoryUrl || null,
      ownerId: session.user.id,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/projects');
  redirect(`/dashboard/projects/${project.slug}`);
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireProjectAccess(session.user.id, projectId);
  await db.project.delete({ where: { id: projectId } });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}

export interface LocalProjectInput {
  name: string;
  relativePath: string;
  repositoryUrl: string | null;
  lastActivityAt: string | null;
}

export type ImportLocalResult = { error: string } | { imported: number; created: number };

/**
 * Imports projects detected by the browser-side local-folder scan
 * (components/import-local + lib/local-import). The server has no filesystem —
 * on either host — so this receives metadata only: a name, a sanitized
 * relative path, an optional origin URL, and a file-mtime activity proxy.
 *
 * Upserts by the synthetic path `local:<userId>/<relativePath>`, which is
 * deterministic per folder, so re-importing is idempotent.
 */
export async function importLocalProjects(items: LocalProjectInput[]): Promise<ImportLocalResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not signed in' };

  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'No projects to import' };
  }
  if (items.length > 200) {
    return { error: 'Too many projects in a single import (max 200)' };
  }

  const userId = session.user.id;
  let imported = 0;
  let created = 0;

  for (const item of items) {
    const name = typeof item?.name === 'string' ? item.name.trim().slice(0, 100) : '';
    if (!name) continue;

    // Only http(s)/ssh origin URLs are meaningful; anything else is dropped.
    const repositoryUrl =
      typeof item?.repositoryUrl === 'string' && /^(https?:\/\/|git@)\S+/.test(item.repositoryUrl)
        ? item.repositoryUrl
        : null;

    const relativePath = typeof item?.relativePath === 'string' ? item.relativePath : '';
    const path = `local:${userId}/${relativePath || name.toLowerCase()}`;

    const lastActivityAt = (() => {
      if (typeof item?.lastActivityAt !== 'string') return null;
      const date = new Date(item.lastActivityAt);
      return Number.isNaN(date.getTime()) ? null : date;
    })();

    const existing = await db.project.findFirst({
      where: { ownerId: userId, path },
      select: { id: true },
    });

    if (existing) {
      await db.project.update({
        where: { id: existing.id },
        data: {
          name,
          repositoryUrl,
          ...(lastActivityAt ? { lastActivityAt } : {}),
        },
      });
    } else {
      const slug = await uniqueSlug(name, userId);
      await db.project.create({
        data: {
          name,
          slug,
          path,
          repositoryUrl,
          ownerId: userId,
          ...(lastActivityAt ? { lastActivityAt } : {}),
        },
      });
      created += 1;
    }
    imported += 1;
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/projects');

  if (imported === 0) {
    return { error: 'No valid git repositories found in the selected folder' };
  }
  return { imported, created };
}
