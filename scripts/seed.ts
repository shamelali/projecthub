import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const user = await db.user.upsert({
    where: { email: 'demo@projecthub.dev' },
    update: {},
    create: {
      email: 'demo@projecthub.dev',
      name: 'Demo User',
      role: 'PERSONAL',
    },
  });
  console.log(`  User: ${user.email}`);

  // Create user preferences
  await db.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'SYSTEM',
      defaultView: 'GRID',
      projectsPath: ['/home/user/projects'],
    },
  });

  // Create projects
  const projectData = [
    {
      name: 'ProjectHub',
      slug: 'projecthub',
      description: 'A full-stack project management platform for developers',
      path: '/home/user/projects/projecthub',
      repositoryUrl: 'https://github.com/user/projecthub',
      status: 'ACTIVE' as const,
      techStack: ['TypeScript', 'Next.js', 'Prisma'],
    },
    {
      name: 'API Server',
      slug: 'api-server',
      description: 'RESTful API backend with authentication',
      path: '/home/user/projects/api-server',
      repositoryUrl: 'https://github.com/user/api-server',
      status: 'ACTIVE' as const,
      techStack: ['Node.js', 'Express', 'PostgreSQL'],
    },
    {
      name: 'Mobile App',
      slug: 'mobile-app',
      description: 'Cross-platform mobile application',
      path: '/home/user/projects/mobile-app',
      status: 'ON_HOLD' as const,
      techStack: ['React Native', 'TypeScript'],
    },
    {
      name: 'Legacy Website',
      slug: 'legacy-website',
      description: 'Old marketing website being phased out',
      path: '/home/user/projects/legacy-website',
      status: 'DEPRECATED' as const,
      techStack: ['PHP', 'MySQL'],
    },
  ];

  const projects = [];
  for (const data of projectData) {
    const project = await db.project.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        ownerId: user.id,
      },
    });
    projects.push(project);
    console.log(`  Project: ${project.name}`);
  }

  // Create tasks for the first project
  const taskData = [
    {
      title: 'Set up CI/CD pipeline',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      position: 0,
    },
    {
      title: 'Implement user authentication',
      status: 'DONE' as const,
      priority: 'CRITICAL' as const,
      position: 1,
    },
    {
      title: 'Design database schema',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      position: 2,
    },
    {
      title: 'Build dashboard UI',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      position: 3,
    },
    {
      title: 'Add project detail pages',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      position: 4,
    },
    {
      title: 'Write API documentation',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      position: 5,
    },
    {
      title: 'Set up error tracking',
      status: 'TODO' as const,
      priority: 'LOW' as const,
      position: 6,
    },
    {
      title: 'Performance optimization',
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
      position: 7,
    },
    {
      title: 'Add dark mode support',
      status: 'IN_REVIEW' as const,
      priority: 'MEDIUM' as const,
      position: 8,
    },
    {
      title: 'Fix login redirect loop',
      status: 'BLOCKED' as const,
      priority: 'CRITICAL' as const,
      position: 9,
    },
  ];

  for (const data of taskData) {
    await db.task.create({
      data: {
        ...data,
        projectId: projects[0].id,
        reporterId: user.id,
        assigneeId: user.id,
      },
    });
  }
  console.log(`  Created ${taskData.length} tasks for ${projects[0].name}`);

  // Create tasks for the second project
  const apiTasks = [
    {
      title: 'Design API endpoints',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      position: 0,
    },
    {
      title: 'Implement JWT auth',
      status: 'DONE' as const,
      priority: 'CRITICAL' as const,
      position: 1,
    },
    {
      title: 'Add rate limiting',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      position: 2,
    },
    {
      title: 'Write integration tests',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      position: 3,
    },
  ];

  for (const data of apiTasks) {
    await db.task.create({
      data: {
        ...data,
        projectId: projects[1].id,
        reporterId: user.id,
        assigneeId: user.id,
      },
    });
  }
  console.log(`  Created ${apiTasks.length} tasks for ${projects[1].name}`);

  // Create a note
  await db.projectNote.create({
    data: {
      title: 'Getting Started',
      content:
        '# Welcome to ProjectHub\n\nThis is a **demo project** to showcase the platform.\n\n## Features\n- Task management\n- Git integration\n- Team collaboration',
      projectId: projects[0].id,
      userId: user.id,
      isPinned: true,
    },
  });
  console.log('  Created project note');

  // Create notifications
  await db.notification.createMany({
    data: [
      {
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: "You have been assigned to 'Build dashboard UI'",
        userId: user.id,
        projectId: projects[0].id,
      },
      {
        type: 'DEPLOYMENT_SUCCESS',
        title: 'Deployment successful',
        message: 'API Server deployed to production',
        userId: user.id,
        projectId: projects[1].id,
      },
    ],
  });
  console.log('  Created notifications');

  console.log('\nSeed complete! Sign in with: demo@projecthub.dev');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
