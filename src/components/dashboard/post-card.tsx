"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  CalendarClock,
  MessageSquare,
  Image as ImageIcon,
  Video,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePost, publishNow } from "@/actions/posts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostMedia {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
}

interface ThreadItem {
  id: string;
  postId: string;
  position: number;
  text: string;
  tweetId: string | null;
  media: PostMedia[];
}

interface XAccount {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

export interface PostCardPost {
  id: string;
  workspaceId: string;
  xAccountId: string | null;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  error: string | null;
  threadItems: ThreadItem[];
  xAccount?: XAccount | null;
  _count?: { comments: number };
}

interface PostCardProps {
  post: PostCardPost;
  onMutate?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  PostCardPost["status"],
  { label: string; variant: "secondary" | "default" | "destructive" | "outline"; className?: string }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  IN_REVIEW: { label: "In Review", variant: "outline", className: "border-purple-500/50 text-purple-500" },
  SCHEDULED: { label: "Scheduled", variant: "outline", className: "border-blue-500/50 text-blue-500" },
  PUBLISHING: { label: "Publishing", variant: "outline", className: "border-yellow-500/50 text-yellow-500" },
  PUBLISHED: { label: "Published", variant: "outline", className: "border-green-500/50 text-green-500" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function relativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostCard({
  post,
  onMutate,
  selectable = false,
  selected = false,
  onToggleSelect,
}: PostCardProps) {
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);

  const firstItem = post.threadItems[0];
  const previewText = firstItem ? truncate(firstItem.text, 120) : "(empty)";
  const threadCount = post.threadItems.length;
  const mediaCount = post.threadItems.reduce(
    (sum, item) => sum + (item.media?.length ?? 0),
    0
  );
  const videoCount = post.threadItems.reduce(
    (sum, item) => sum + (item.media?.filter((m) => m.mediaType === "VIDEO").length ?? 0),
    0
  );
  const commentCount = post._count?.comments ?? 0;
  const badge = STATUS_BADGE[post.status];

  // First media for thumbnail
  const firstMedia = firstItem?.media?.[0];

  // --- Handlers ---

  async function handleDelete() {
    setIsActing(true);
    try {
      const result = await deletePost(post.id);
      if (result.success) {
        toast.success("Post deleted");
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to delete post");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function handlePublishNow() {
    setIsActing(true);
    try {
      const result = await publishNow(post.id);
      if (result.success) {
        toast.success("Post queued for publishing");
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to publish post");
      }
    } finally {
      setIsActing(false);
    }
  }

  function handleEdit() {
    router.push(`/dashboard?edit=${post.id}`);
  }

  // --- Render ---

  return (
    <Card className={cn(
      "gap-0 py-0 transition-all hover:border-muted-foreground/30 hover:shadow-sm",
      selected && "ring-2 ring-primary border-primary"
    )}>
      <CardContent className="flex items-start gap-4 px-4 py-4">
        {/* Checkbox for bulk select */}
        {selectable && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(post.id)}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Status + meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badge.variant} className={cn("text-[11px]", badge.className)}>
              {badge.label}
            </Badge>

            {post.xAccount && (
              <span className="text-xs text-muted-foreground">
                @{post.xAccount.username}
              </span>
            )}

            {threadCount > 1 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="size-3" />
                {threadCount}
              </span>
            )}

            {mediaCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {videoCount > 0 ? <Video className="size-3" /> : <ImageIcon className="size-3" />}
                {mediaCount}
              </span>
            )}

            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3" />
                {commentCount}
              </span>
            )}
          </div>

          {/* Text preview */}
          <p className="text-sm leading-relaxed">{previewText}</p>

          {/* Media thumbnail strip */}
          {firstMedia && (
            <div className="flex gap-1.5 overflow-hidden">
              {firstItem.media.slice(0, 3).map((m) => (
                <div key={m.id} className="relative h-12 w-16 shrink-0 overflow-hidden rounded border bg-muted">
                  {m.mediaType === "VIDEO" ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="size-4 text-muted-foreground" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
              {firstItem.media.length > 3 && (
                <div className="flex h-12 w-8 items-center justify-center text-xs text-muted-foreground">
                  +{firstItem.media.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          {post.scheduledAt && post.status === "SCHEDULED" && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3" />
              {format(new Date(post.scheduledAt), "MMM d 'at' h:mm a")}
              <span className="text-muted-foreground/60">({relativeTime(post.scheduledAt)})</span>
            </p>
          )}

          {post.publishedAt && post.status === "PUBLISHED" && (
            <p className="text-xs text-muted-foreground">
              Published {relativeTime(post.publishedAt)}
            </p>
          )}

          {!post.scheduledAt && !post.publishedAt && (
            <p className="text-xs text-muted-foreground">
              {relativeTime(post.createdAt)}
            </p>
          )}

          {post.status === "FAILED" && post.error && (
            <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3 shrink-0" />
              <span>{post.error}</span>
            </div>
          )}
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" disabled={isActing}>
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Post actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(post.status === "DRAFT" || post.status === "FAILED" || post.status === "IN_REVIEW") && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
            )}

            {post.status === "DRAFT" && post.xAccountId && (
              <DropdownMenuItem onClick={handlePublishNow} disabled={isActing}>
                <Send className="mr-2 size-4" />
                Publish Now
              </DropdownMenuItem>
            )}

            {post.status === "SCHEDULED" && (
              <DropdownMenuItem onClick={handleEdit}>
                <CalendarClock className="mr-2 size-4" />
                Reschedule
              </DropdownMenuItem>
            )}

            {["DRAFT", "SCHEDULED", "FAILED", "IN_REVIEW"].includes(post.status) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isActing}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
