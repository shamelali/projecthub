import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TasksPage() {
  const session = await auth();

  const tasks = await db.task.findMany({
    where: {
      OR: [
        { assigneeId: session?.user?.id },
        { reporterId: session?.user?.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true, slug: true } },
      assignee: { select: { name: true, email: true } },
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "BLOCKED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "DONE":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "IN_REVIEW":
        return "outline";
      case "BLOCKED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">All your tasks across projects</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No tasks yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tasks will appear here when they are assigned to you.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {statusIcon(task.status)}
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.project.name} · {task.assignee?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                  <Badge variant="outline">{task.priority}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
