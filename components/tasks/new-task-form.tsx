"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "@/lib/actions/tasks";

interface NewTaskFormProps {
  projectId: string;
  status?: string;
}

export function NewTaskForm({ projectId, status = "TODO" }: NewTaskFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("projectId", projectId);
    formData.append("priority", priority);
    formData.append("status", status);

    await createTask(formData);
    setTitle("");
    setIsOpen(false);
    router.refresh();
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setIsOpen(true)}
      >
        + Add Task
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border bg-card p-3">
      <Input
        autoFocus
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Add
        </Button>
      </div>
    </form>
  );
}
