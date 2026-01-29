"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Activity, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspace } from "@/hooks/use-workspace";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function ActivityPage() {
  const { workspaceId } = useWorkspace();

  const { data, isLoading } = useSWR(
    workspaceId ? `/api/activity?workspaceId=${workspaceId}` : null,
    fetcher
  );

  const activities: ActivityItem[] = data?.activities ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Recent workspace activity and audit log.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Activity className="size-10 stroke-1" />
          <p className="text-sm">No activity yet.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="space-y-0">
          {activities.map((item, index) => (
            <div
              key={item.id}
              className="flex gap-3 py-3 border-b last:border-b-0"
            >
              <Avatar className="h-8 w-8 shrink-0">
                {item.user.image && <AvatarImage src={item.user.image} />}
                <AvatarFallback className="text-[10px]">
                  {(item.user.name || item.user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">
                    {item.user.name || item.user.email}
                  </span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>
                  {item.details && (
                    <span className="text-muted-foreground"> — {item.details}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
