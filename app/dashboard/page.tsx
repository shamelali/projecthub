import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectAccessWhere } from "@/lib/permissions";
import Link from "next/link";
import { FolderGit2, GitBranch, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const projectWhere = session?.user?.id
    ? projectAccessWhere(session.user.id)
    : { id: "" };

  const [projectCount, taskCount, recentProjects] = await Promise.all([
    db.project.count({ where: projectWhere }),
    db.task.count({
      where: {
        AND: [
          {
            OR: [
              { assigneeId: session?.user?.id },
              { reporterId: session?.user?.id },
            ],
          },
          { project: projectWhere },
        ],
        status: { not: "DONE" },
      },
    }),
    db.project.findMany({
      where: projectWhere,
      orderBy: { lastActivityAt: "desc" },
      take: 5,
      include: { _count: { select: { tasks: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Projects", value: projectCount, icon: FolderGit2 },
    { label: "Active Tasks", value: taskCount, icon: CheckCircle2 },
    { label: "Git Repos", value: projectCount, icon: GitBranch },
    { label: "Hours This Week", value: 0, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name || "there"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first project.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{project._count.tasks} tasks</span>
                      <span className="truncate">{project.path}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
