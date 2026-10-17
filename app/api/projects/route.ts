import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectAccessWhere } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, path, repositoryUrl } = body;

  if (!name || !path) {
    return NextResponse.json({ error: 'Name and path are required' }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'A project with this name already exists' }, { status: 409 });
  }

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

  // Retrieve pending tasks (NOT DONE) for the newly created project
  const pendingTasks = await db.task.findMany({
    where: {
      projectId: project.id,
      status: { not: 'DONE' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      project: true,
      assignee: { select: { name: true, email: true } },
      reporter: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ project, pendingTasks }, { status: 201 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: projectAccessWhere(session.user.id),
    orderBy: { lastActivityAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(projects);
}
