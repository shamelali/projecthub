'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireProjectAccess, requireTaskAccess } from '@/lib/permissions';
import { branchTag, branchesFromTags, commitTag, shasFromTags } from '@/lib/task-tags';

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

  await touchProject(projectId);

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

/**
 * Keeps `lastActivityAt` truthful: task movement is project activity, and the
 * projects grid sorts and displays by it. Called after every task mutation.
 */
async function touchProject(projectId: string) {
  await db.project.update({
    where: { id: projectId },
    data: { lastActivityAt: new Date() },
  });
}

export async function moveTask(taskId: string, status: string, position: number) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireTaskAccess(session.user.id, taskId);
  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      status: status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED',
      position,
      ...(status === 'DONE' ? { completedAt: new Date() } : {}),
      ...(status !== 'DONE' ? { completedAt: null } : {}),
    },
    select: { projectId: true },
  });
  await touchProject(updated.projectId);

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const task = await requireTaskAccess(session.user.id, taskId);
  await db.task.delete({ where: { id: taskId } });
  await touchProject(task.projectId);

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
  // A partial form (e.g. only a due-date change) sends just its own fields, so
  // every field is guarded on presence — absent means "leave unchanged".
  const dueDate = formData.has('dueDate') ? (formData.get('dueDate') as string) || null : null;

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      title: title || undefined,
      description: description || undefined,
      priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || undefined,
      ...(formData.has('assigneeId') ? { assigneeId: assigneeId || null } : {}),
      ...(formData.has('dueDate') ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    select: { projectId: true },
  });
  await touchProject(updated.projectId);

  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/projects/[slug]');
}

export async function populateTasksFromProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await requireProjectAccess(session.user.id, projectId);

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      gitCommits: {
        where: { isMerge: false },
        orderBy: { authorDate: 'desc' },
        take: 20,
      },
      branches: { orderBy: { name: 'asc' } },
      tasks: { select: { tags: true, title: true } },
    },
  });

  if (!project) return { created: 0, error: 'Project not found' };

  // Tags recorded on auto-created tasks so re-populating is idempotent.
  const existingCommitShas = new Set(
    project.tasks.flatMap((task) => shasFromTags(task.tags))
  );
  const existingBranchNames = new Set(
    project.tasks.flatMap((task) => branchesFromTags(task.tags))
  );
  const existingTitles = new Set(project.tasks.map((task) => task.title));

  let created = 0;

  // One task per recent non-merge commit.
  for (const commit of project.gitCommits) {
    if (existingCommitShas.has(commit.sha)) continue;
    const title = commit.message.split('\n')[0].trim() || `Commit ${commit.shortSha}`;
    if (existingTitles.has(title)) continue;

    await db.task.create({
      data: {
        title,
        description:
          `Auto-populated from commit ${commit.shortSha} by ${commit.authorName}.\n\n` +
          commit.message,
        projectId,
        reporterId: session.user.id,
        status: 'TODO',
        priority: 'MEDIUM',
        // The date the commit's work actually happened. completedAt is
        // deliberately not set — that is owned by the DONE transition.
        startedAt: commit.authorDate,
        tags: [commitTag(commit.sha), `author:${commit.authorName}`],
      },
    });
    existingCommitShas.add(commit.sha);
    existingTitles.add(title);
    created += 1;
  }

  // One task per non-default branch.
  for (const branch of project.branches) {
    if (branch.isDefault) continue;
    if (existingBranchNames.has(branch.name)) continue;
    const title = `Branch: ${branch.name}`;
    if (existingTitles.has(title)) continue;

    await db.task.create({
      data: {
        title,
        description: `Auto-populated from branch ${branch.name}.`,
        projectId,
        reporterId: session.user.id,
        status: 'BACKLOG',
        priority: 'LOW',
        tags: [branchTag(branch.name)],
      },
    });
    existingBranchNames.add(branch.name);
    existingTitles.add(title);
    created += 1;
  }

  if (created > 0) {
    await touchProject(projectId);
  }

  revalidatePath('/dashboard/tasks');
  revalidatePath(`/dashboard/projects/${project.slug}`);

  return { created };
}
