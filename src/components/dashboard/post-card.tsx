"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  CalendarClock,
  MessageSquare,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface PostImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

interface ThreadItem {
  id: string;
  postId: string;
  position: number;
  text: string;
  tweetId: string | null;
  images: PostImage[];
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
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  error: string | null;
  threadItems: ThreadItem[];
  xAccount?: XAccount | null;
}

interface PostCardProps {
  post: PostCardPost;
  onMutate?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<
  PostCardPost["status"],
  { label: string; variant: "secondary" | "default" | "destructive" | "outline"; className?: string }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SCHEDULED: { label: "Scheduled", variant: "outline", className: "border-blue-500/50 text-blue-500" },
  PUBLISHING: { label: "Publishing", variant: "outline", className: "border-yellow-500/50 text-yellow-500" },
  PUBLISHED: { label: "Published", variant: "outline", className: "border-green-500/50 text-green-500" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostCard({ post, onMutate }: PostCardProps) {
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);

  const firstItem = post.threadItems[0];
  const previewText = firstItem ? truncate(firstItem.text, 100) : "(empty)";
  const threadCount = post.threadItems.length;
  const imageCount = post.threadItems.reduce(
    (sum, item) => sum + item.images.length,
    0
  );

  const badge = STATUS_BADGE[post.status];

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
    <Card className="gap-0 py-0 transition-colors hover:border-muted-foreground/30">
      <CardContent className="flex items-start gap-4 px-4 py-4">
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
                {threadCount} tweets
              </span>
            )}

            {imageCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ImageIcon className="size-3" />
                {imageCount}
              </span>
            )}
          </div>

          {/* Text preview */}
          <p className="text-sm leading-relaxed">{previewText}</p>

          {/* Schedule / published time */}
          {post.scheduledAt && post.status === "SCHEDULED" && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3" />
              Scheduled for {format(new Date(post.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}

          {post.publishedAt && post.status === "PUBLISHED" && (
            <p className="text-xs text-muted-foreground">
              Published {format(new Date(post.publishedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}

          {!post.scheduledAt && !post.publishedAt && (
            <p className="text-xs text-muted-foreground">
              Created {format(new Date(post.createdAt), "MMM d, yyyy")}
            </p>
          )}

          {/* Error message for failed posts */}
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
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0"
              disabled={isActing}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Post actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Edit - available for DRAFT and FAILED */}
            {(post.status === "DRAFT" || post.status === "FAILED") && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
            )}

            {/* Publish Now - available for DRAFT */}
            {post.status === "DRAFT" && post.xAccountId && (
              <DropdownMenuItem onClick={handlePublishNow} disabled={isActing}>
                <Send className="mr-2 size-4" />
                Publish Now
              </DropdownMenuItem>
            )}

            {/* Reschedule - available for SCHEDULED */}
            {post.status === "SCHEDULED" && (
              <DropdownMenuItem onClick={handleEdit}>
                <CalendarClock className="mr-2 size-4" />
                Reschedule
              </DropdownMenuItem>
            )}

            {/* Delete - available for DRAFT, SCHEDULED, FAILED */}
            {["DRAFT", "SCHEDULED", "FAILED"].includes(post.status) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
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
