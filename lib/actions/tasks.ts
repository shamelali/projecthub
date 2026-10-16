'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireProjectAccess, requireTaskAccess } from '@/lib/permissions';

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const projectId = formData.get('projectId') as string;
  const assigneeId = formData.get('assigneeId') as string;

  if (!title || !projectId) return;

  await requireProjectAccess(session.user.id, projectId);

  const maxPosition = await db.task.aggregate({
    where: { projectId, status: 'TODO' },
    _max: { position: true },
  });

  await db.task.create({
    data: {
      title,
      description: description || undefined,
      priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
      projectId,
      reporterId: session.user.id,
      assigneeId: assigneeId || undefined,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

export async function moveTask(taskId: string, status: string, position: number) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireTaskAccess(session.user.id, taskId);
  await db.task.update({
    where: { id: taskId },
    data: {
      status: status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED',
      position,
      ...(status === 'DONE' ? { completedAt: new Date() } : {}),
    },
  });

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireTaskAccess(session.user.id, taskId);
  await db.task.delete({ where: { id: taskId } });

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

export async function updateTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireTaskAccess(session.user.id, taskId);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const priority = formData.get('priority') as string;
  const assigneeId = formData.get('assigneeId') as string;

  await db.task.update({
    where: { id: taskId },
    data: {
      title: title || undefined,
      description: description || undefined,
      priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || undefined,
      assigneeId: assigneeId || null,
    },
  });

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}
