"use client";

import useSWR from "swr";
import { PostCard, type PostCardPost } from "@/components/dashboard/post-card";
import { SWR_REFRESH_INTERVAL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostListProps {
  workspaceId: string;
  status?: string;
  emptyMessage?: string;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  });

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PostCardSkeleton() {
  return (
    <Card className="gap-0 py-0 animate-pulse">
      <CardContent className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
        <div className="h-3 w-40 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostList({
  workspaceId,
  status,
  emptyMessage = "No posts yet",
}: PostListProps) {
  const params = new URLSearchParams({ workspaceId });
  if (status) params.set("status", status);

  const { data, error, isLoading, mutate } = useSWR<PostCardPost[]>(
    `/api/posts?${params.toString()}`,
    fetcher,
    { refreshInterval: SWR_REFRESH_INTERVAL }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load posts. Please try again.
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Inbox className="size-10 stroke-1" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Posts list
  return (
    <div className="space-y-3">
      {data.map((post) => (
        <PostCard key={post.id} post={post} onMutate={() => mutate()} />
      ))}
    </div>
  );
}
