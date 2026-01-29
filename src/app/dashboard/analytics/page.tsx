"use client";

import useSWR from "swr";
import { BarChart3, Eye, Heart, Repeat2, MessageCircle, Bookmark, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { workspaceId } = useWorkspace();

  const { data, isLoading } = useSWR(
    workspaceId ? `/api/analytics?workspaceId=${workspaceId}` : null,
    fetcher
  );

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your post performance and engagement.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const totals = data.totals ?? {
    impressions: 0,
    likes: 0,
    retweets: 0,
    replies: 0,
    bookmarks: 0,
    quotes: 0,
  };

  const engagementRate = data.engagementRate ?? 0;
  const totalEngagements =
    totals.likes + totals.retweets + totals.replies + totals.bookmarks + totals.quotes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your post performance and engagement.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Impressions" value={totals.impressions} icon={Eye} />
        <StatCard label="Likes" value={totals.likes} icon={Heart} />
        <StatCard label="Retweets" value={totals.retweets} icon={Repeat2} />
        <StatCard label="Replies" value={totals.replies} icon={MessageCircle} />
        <StatCard label="Bookmarks" value={totals.bookmarks} icon={Bookmark} />
        <StatCard label="Total Engagements" value={totalEngagements} icon={BarChart3} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top posts */}
      {data.posts && data.posts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Top Posts</h2>
          <div className="space-y-2">
            {data.posts.slice(0, 10).map((post: any) => (
              <Card key={post.postId}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <p className="text-sm truncate max-w-[300px]">
                    {post.postText || "Post"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {(post.impressions ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3" />
                      {(post.likes ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="size-3" />
                      {(post.retweets ?? 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.posts?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <BarChart3 className="size-10 stroke-1" />
          <p className="text-sm">No analytics data yet. Publish posts to see metrics.</p>
        </div>
      )}
    </div>
  );
}
