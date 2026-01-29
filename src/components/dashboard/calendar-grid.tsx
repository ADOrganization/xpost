"use client";

import { useState, useCallback, type DragEvent } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reschedulePost } from "@/actions/posts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarPost {
  id: string;
  status: string;
  scheduledAt: string | null;
  threadItems: {
    id: string;
    position: number;
    text: string;
  }[];
}

interface CalendarGridProps {
  posts: CalendarPost[];
  workspaceId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "...";
}

function getPostsForDay(posts: CalendarPost[], day: Date): CalendarPost[] {
  return posts.filter(
    (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarGrid({ posts, workspaceId }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localPosts, setLocalPosts] = useState(posts);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning of the grid to align with the correct weekday
  const startPadding = getDay(monthStart); // 0 = Sunday

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  // --- Drag and drop handlers ---

  function handleDragStart(e: DragEvent<HTMLDivElement>, postId: string) {
    e.dataTransfer.setData("text/plain", postId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(postId);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>, targetDay: Date) {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain");
    if (!postId) return;

    setDraggingId(null);

    // Find the original post to preserve the time
    const original = localPosts.find((p) => p.id === postId);
    if (!original || !original.scheduledAt) return;

    const originalDate = new Date(original.scheduledAt);
    // Set the new date but keep the original time
    let newDate = setHours(targetDay, originalDate.getHours());
    newDate = setMinutes(newDate, originalDate.getMinutes());
    newDate = setSeconds(newDate, originalDate.getSeconds());

    // Optimistic update
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduledAt: newDate.toISOString() } : p
      )
    );

    // Call server action
    const result = await reschedulePost(postId, newDate);
    if (!result.success) {
      // Revert on failure
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, scheduledAt: original.scheduledAt }
            : p
        )
      );
    }
  }

  // --- Render ---

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={goToPrevMonth}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextMonth}>
            <ChevronRight className="size-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px rounded-t-lg border border-b-0 bg-muted">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-background px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px -mt-4 rounded-b-lg border border-t-0 bg-muted overflow-hidden">
        {/* Padding cells for days before month start */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[100px] bg-background/50" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayPosts = getPostsForDay(localPosts, day);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-1.5 transition-colors",
                isCurrentMonth ? "bg-background" : "bg-background/50",
                isWeekend && "bg-muted/30",
                draggingId && "hover:bg-accent/50"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Day number */}
              <div className="mb-1 flex items-center justify-end">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    isCurrentDay
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Posts in this day */}
              <div className="space-y-1">
                {dayPosts.map((post) => {
                  const text = post.threadItems[0]?.text ?? "";
                  const time = post.scheduledAt
                    ? format(new Date(post.scheduledAt), "h:mm a")
                    : "";

                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab rounded-md border bg-card px-1.5 py-1 text-[11px] leading-tight transition-opacity active:cursor-grabbing",
                        draggingId === post.id && "opacity-50"
                      )}
                    >
                      <div className="font-medium text-muted-foreground">
                        {time}
                      </div>
                      <div className="line-clamp-2 text-foreground">
                        {truncate(text, 50)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Trailing padding cells to fill the last row */}
        {(() => {
          const totalCells = startPadding + days.length;
          const remainder = totalCells % 7;
          if (remainder === 0) return null;
          const trailingPad = 7 - remainder;
          return Array.from({ length: trailingPad }).map((_, i) => (
            <div
              key={`trail-${i}`}
              className="min-h-[100px] bg-background/50"
            />
          ));
        })()}
      </div>
    </div>
  );
}
