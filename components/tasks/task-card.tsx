"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteTask } from "@/lib/actions/tasks";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee?: { name: string | null } | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    await deleteTask(task.id);
    router.refresh();
  };

  const priorityVariant = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "default";
      case "MEDIUM":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="group relative">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {task.assignee?.name || "Unassigned"}
          </span>
          <Badge variant={priorityVariant(task.priority)} className="text-[10px]">
            {task.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
