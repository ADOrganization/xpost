"use client";

import { CalendarGrid } from "@/components/dashboard/calendar-grid";
import { useWorkspace } from "@/hooks/use-workspace";

export default function CalendarPage() {
  const { workspaceId } = useWorkspace();

  if (!workspaceId) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Drag and drop posts to reschedule them.
        </p>
      </div>

      <CalendarGrid workspaceId={workspaceId} />
    </div>
  );
}
