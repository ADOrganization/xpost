"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostList } from "@/components/dashboard/post-list";

interface DashboardTabsProps {
  workspaceId: string;
}

export function DashboardTabs({ workspaceId }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="queue">
      <TabsList>
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="published">Published</TabsTrigger>
        <TabsTrigger value="failed">Failed</TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="mt-4">
        <PostList
          workspaceId={workspaceId}
          status="SCHEDULED"
          emptyMessage="No posts in the queue. Schedule a post to get started."
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
    </Tabs>
  );
}
