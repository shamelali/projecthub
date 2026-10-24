import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scanDirectoryForProjects } from '@/lib/git/scanner';
import { isPathWithinConfiguredPath } from '@/lib/path-security';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const path = body?.path;

  if (typeof path !== 'string' || !path.trim()) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  const preferences = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
    select: { projectsPath: true },
  });

  if (!preferences || !isPathWithinConfiguredPath(path, preferences.projectsPath)) {
    return NextResponse.json(
      { error: 'Scan path is outside your configured project paths' },
      { status: 403 }
    );
  }

  const projects = await scanDirectoryForProjects(path);

  return NextResponse.json({ projects });
}
