import { getActiveWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { CalendarGrid } from "@/components/dashboard/calendar-grid";

export default async function CalendarPage() {
  const { workspace } = await getActiveWorkspace();

  // Fetch scheduled posts for a wide range (current month +/- 1 month)
  // so navigation in the client component has data available
  const now = new Date();
  const rangeStart = startOfMonth(now);
  const rangeEnd = endOfMonth(now);

  const posts = await prisma.post.findMany({
    where: {
      workspaceId: workspace.id,
      status: "SCHEDULED",
      scheduledAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    include: {
      threadItems: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          text: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Serialize dates for client component
  const serializedPosts = posts.map((p) => ({
    id: p.id,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    threadItems: p.threadItems,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Drag and drop posts to reschedule them.
        </p>
      </div>

      <CalendarGrid posts={serializedPosts} workspaceId={workspace.id} />
    </div>
  );
}
