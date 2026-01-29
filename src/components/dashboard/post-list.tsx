"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { PostCard, type PostCardPost } from "@/components/dashboard/post-card";
import { SWR_REFRESH_INTERVAL, PAGE_SIZE } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, Loader2 } from "lucide-react";

interface PostListProps {
  workspaceId: string;
  status?: string;
  emptyMessage?: string;
  searchQuery?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
}

interface PostsResponse {
  posts: PostCardPost[];
  total: number;
  page: number;
  pageSize: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  });

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

export function PostList({
  workspaceId,
  status,
  emptyMessage = "No posts yet",
  searchQuery,
  selectedIds,
  onToggleSelect,
  selectable = false,
}: PostListProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);

  const getKey = (pageIndex: number, previousPageData: PostsResponse | null) => {
    if (previousPageData && previousPageData.posts.length < PAGE_SIZE) return null;

    const params = new URLSearchParams({ workspaceId, page: String(pageIndex + 1) });
    if (status) params.set("status", status);
    if (searchQuery) params.set("q", searchQuery);
    return `/api/posts?${params.toString()}`;
  };

  const {
    data,
    error,
    isLoading,
    size,
    setSize,
    mutate,
    isValidating,
  } = useSWRInfinite<PostsResponse>(getKey, fetcher, {
    refreshInterval: SWR_REFRESH_INTERVAL,
    revalidateFirstPage: true,
  });

  const posts = data ? data.flatMap((page) => page.posts) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.posts.length === 0;

  useEffect(() => {
    if (data) {
      const lastPage = data[data.length - 1];
      setHasMore(lastPage ? lastPage.posts.length >= PAGE_SIZE : false);
    }
  }, [data]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isValidating) {
        setSize((s) => s + 1);
      }
    },
    [hasMore, isValidating, setSize]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load posts. Please try again.
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <Inbox className="size-10 stroke-1" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onMutate={() => mutate()}
          selectable={selectable}
          selected={selectedIds?.has(post.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
