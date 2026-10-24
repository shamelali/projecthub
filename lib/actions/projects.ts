'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
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
