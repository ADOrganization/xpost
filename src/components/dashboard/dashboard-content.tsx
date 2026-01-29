"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ComposePanel, type EditingPost } from "@/components/compose/compose-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { XAccountOption } from "@/lib/types";

interface DashboardContentProps {
  workspaceId: string;
  accounts: XAccountOption[];
}

function ComposeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function DashboardContent({ workspaceId, accounts }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const editId = searchParams.get("edit");

  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Fetch post data when editing
  useEffect(() => {
    if (!editId) {
      setEditingPost(null);
      setIsLoadingEdit(false);
      return;
    }

    setIsLoadingEdit(true);

    fetch(`/api/posts/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch post");
        return res.json();
      })
      .then((post) => {
        setEditingPost({
          id: post.id,
          threadItems: post.threadItems.map((item: any) => ({
            text: item.text,
            media: (item.media || item.images || []).map((m: any) => ({
              url: m.url,
              altText: m.altText || "",
              mediaType: m.mediaType || "IMAGE",
            })),
          })),
          pollOptions: post.threadItems[0]?.pollOptions?.map((opt: any) => opt.label) || [],
          pollDuration: post.pollDuration ?? null,
          xAccountId: post.xAccountId,
          scheduledAt: post.scheduledAt,
          status: post.status,
        });
      })
      .catch(() => {
        toast.error("Failed to load post for editing");
        setEditingPost(null);
        router.replace("/dashboard");
      })
      .finally(() => {
        setIsLoadingEdit(false);
      });
  }, [editId, router]);

  const handlePostSaved = useCallback(() => {
    mutate(
      (key: string) => typeof key === "string" && key.startsWith("/api/posts"),
      undefined,
      { revalidate: true }
    );
    if (editId) {
      router.replace("/dashboard");
    }
  }, [mutate, editId, router]);

  return (
    <div className="h-full overflow-auto">
      {isLoadingEdit ? (
        <ComposeSkeleton />
      ) : (
        <ComposePanel
          accounts={accounts}
          workspaceId={workspaceId}
          editingPost={editingPost}
          onPostSaved={handlePostSaved}
        />
      )}
    </div>
  );
}
