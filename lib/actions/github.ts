'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getGitHubAccessToken } from '@/lib/github-token';
import { parseRepoFromUrl, syncGitHubRepositories, syncProjectGitData } from '@/lib/github';

export async function importGitHubRepositories() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not signed in' };
  }

  const accessToken = await getGitHubAccessToken(session.user.id);

  if (!accessToken) {
    return { error: 'No GitHub account is linked to this account' };
  }

  return syncGitHubRepositories({
    userId: session.user.id,
    accessToken,
  });
}

export async function syncProjectGitDataAction(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not signed in' };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, repositoryUrl: true },
  });

  if (!project || project.ownerId !== session.user.id) {
    return { error: 'Project not found' };
  }

  if (!project.repositoryUrl || !parseRepoFromUrl(project.repositoryUrl)) {
    return { error: 'Project is not linked to a GitHub repository' };
  }

  const accessToken = await getGitHubAccessToken(session.user.id);

  if (!accessToken) {
    return { error: 'No GitHub account is linked to this account' };
  }

  return syncProjectGitData({
    projectId,
    userId: session.user.id,
    accessToken,
  });
}
