"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { ComposePanel, type EditingPost } from "@/components/compose/compose-panel";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import type { XAccountOption } from "@/lib/types";

interface DashboardContentProps {
  workspaceId: string;
  accounts: XAccountOption[];
}

export function DashboardContent({ workspaceId, accounts }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const editId = searchParams.get("edit");

  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);

  // Fetch post data when editing
  useEffect(() => {
    if (!editId) {
      setEditingPost(null);
      return;
    }

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
            images: item.images.map((img: any) => ({
              url: img.url,
              altText: img.altText || "",
            })),
          })),
          pollOptions: post.threadItems[0]?.pollOptions?.map((opt: any) => opt.label) || [],
          xAccountId: post.xAccountId,
          scheduledAt: post.scheduledAt,
          status: post.status,
        });
      })
      .catch(() => {
        setEditingPost(null);
        router.replace("/dashboard");
      });
  }, [editId, router]);

  const handlePostSaved = useCallback(() => {
    // Revalidate all post lists
    mutate(
      (key: string) => typeof key === "string" && key.startsWith("/api/posts"),
      undefined,
      { revalidate: true }
    );
    // Clear edit param
    if (editId) {
      router.replace("/dashboard");
    }
  }, [mutate, editId, router]);

  return (
    <div className="flex gap-6 h-full">
      <div className="w-1/3 min-w-[320px] shrink-0 overflow-auto">
        <ComposePanel
          accounts={accounts}
          workspaceId={workspaceId}
          editingPost={editingPost}
          onPostSaved={handlePostSaved}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-auto">
        <DashboardTabs workspaceId={workspaceId} />
      </div>
    </div>
  );
}
