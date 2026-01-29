"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PostList } from "@/components/dashboard/post-list";

interface DashboardTabsProps {
  workspaceId: string;
}

export function DashboardTabs({ workspaceId }: DashboardTabsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="drafts">Drafts</TabsTrigger>
        <TabsTrigger value="review">In Review</TabsTrigger>
        <TabsTrigger value="queue">Posts</TabsTrigger>
        <TabsTrigger value="published">Published</TabsTrigger>
        <TabsTrigger value="failed">Failed</TabsTrigger>
        <TabsTrigger value="search" className="gap-1">
          <Search className="size-3.5" />
          Search
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          emptyMessage="No posts yet. Create your first post!"
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </TabsContent>

      <TabsContent value="drafts" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="DRAFT"
          emptyMessage="No drafts. Start composing!"
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </TabsContent>

      <TabsContent value="review" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="IN_REVIEW"
          emptyMessage="No posts in review."
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </TabsContent>

      <TabsContent value="queue" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="SCHEDULED"
          emptyMessage="No scheduled posts yet. Schedule a post to get started."
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      </TabsContent>

      <TabsContent value="published" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="PUBLISHED"
          emptyMessage="No published posts yet."
        />
      </TabsContent>

      <TabsContent value="failed" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="FAILED"
          emptyMessage="No failed posts. All good!"
        />
      </TabsContent>

      <TabsContent value="search" className="mt-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        {searchQuery ? (
          <PostList
            workspaceId={workspaceId}
            emptyMessage="No posts match your search."
            searchQuery={searchQuery}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Type to search your posts
          </p>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
