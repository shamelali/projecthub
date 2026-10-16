import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

export function projectAccessWhere(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}

export async function requireProjectAccess(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(userId) },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    throw new Error('Forbidden');
  }

  return project;
}

export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, project: projectAccessWhere(userId) },
    select: { id: true, projectId: true },
  });

  if (!task) {
    throw new Error('Forbidden');
  }

  return task;
}
