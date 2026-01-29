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
  Share2,
  Copy,
  Link2Off,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePost, publishNow } from "@/actions/posts";
import { createShareLink, revokeShareLink } from "@/actions/share";
import { FeedbackDialog } from "@/components/dashboard/feedback-dialog";
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
  shareCommentCount?: number;
  shareSuggestionCount?: number;
}

interface PostCardProps {
  post: PostCardPost;
  onMutate?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Share Dialog Sub-component
// ---------------------------------------------------------------------------

function ShareDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLinkId, setShareLinkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setIsLoading(true);
    try {
      const result = await createShareLink(postId);
      if (result.success) {
        setShareUrl(result.url);
        setShareLinkId(result.shareLinkId);
      } else {
        toast.error(result.error || "Failed to create share link");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevoke() {
    if (!shareLinkId) return;
    setIsLoading(true);
    try {
      const result = await revokeShareLink(shareLinkId);
      if (result.success) {
        setShareUrl(null);
        setShareLinkId(null);
        toast.success("Share link revoked");
      } else {
        toast.error(result.error || "Failed to revoke share link");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Create a public link to share this post for feedback.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={isLoading}
              className="w-full"
            >
              <Link2Off className="mr-2 size-4" />
              Revoke Link
            </Button>
          </div>
        ) : (
          <Button onClick={handleCreate} disabled={isLoading} className="w-full">
            <Share2 className="mr-2 size-4" />
            Create Share Link
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

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
  const shareCommentCount = post.shareCommentCount ?? 0;
  const shareSuggestionCount = post.shareSuggestionCount ?? 0;
  const totalFeedbackCount = shareCommentCount + shareSuggestionCount;
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
        toast.success("Post scheduled for publishing");
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
      "group gap-0 py-0 transition-all hover:bg-card/80 hover:border-muted-foreground/25",
      selected && "ring-2 ring-primary border-primary"
    )}>
      <CardContent className="flex items-start gap-3 px-4 py-4">
        {/* Checkbox for bulk select */}
        {selectable && (
          <div className="pt-1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(post.id)}
            />
          </div>
        )}

        {/* X Account Avatar */}
        {post.xAccount && (
          <Avatar className="mt-0.5 h-9 w-9 shrink-0">
            {post.xAccount.profileImageUrl && (
              <AvatarImage src={post.xAccount.profileImageUrl} alt={post.xAccount.displayName} />
            )}
            <AvatarFallback className="text-xs bg-muted">
              {post.xAccount.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top line: account + timestamp */}
          <div className="flex items-center gap-1.5">
            {post.xAccount && (
              <>
                <span className="text-sm font-semibold truncate">
                  {post.xAccount.displayName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  @{post.xAccount.username}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
              </>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {post.scheduledAt && post.status === "SCHEDULED"
                ? format(new Date(post.scheduledAt), "MMM d, h:mm a")
                : post.publishedAt && post.status === "PUBLISHED"
                  ? `Published ${relativeTime(post.publishedAt)}`
                  : relativeTime(post.createdAt)}
            </span>
          </div>

          {/* Text preview */}
          <p className="text-sm leading-relaxed text-foreground/90">{previewText}</p>

          {/* Media thumbnail strip */}
          {firstMedia && (
            <div className="flex gap-1.5 overflow-hidden pt-1">
              {firstItem.media.slice(0, 4).map((m) => (
                <div key={m.id} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
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
              {firstItem.media.length > 4 && (
                <div className="flex h-14 w-10 items-center justify-center text-xs text-muted-foreground">
                  +{firstItem.media.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Bottom meta row: badges + counts */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Badge variant={badge.variant} className={cn("text-[11px] px-2 py-0", badge.className)}>
              {badge.label}
            </Badge>

            {threadCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="size-3" />
                {threadCount} tweets
              </span>
            )}

            {mediaCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                {videoCount > 0 ? <Video className="size-3" /> : <ImageIcon className="size-3" />}
                {mediaCount}
              </span>
            )}

            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="size-3" />
                {commentCount}
              </span>
            )}

            {totalFeedbackCount > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setFeedbackDialogOpen(true);
                }}
              >
                <Share2 className="size-3" />
                {totalFeedbackCount} feedback
              </button>
            )}

            {post.scheduledAt && post.status === "SCHEDULED" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarClock className="size-3" />
                {relativeTime(post.scheduledAt)}
              </span>
            )}
          </div>

          {post.status === "FAILED" && post.error && (
            <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive mt-1">
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
              size="icon"
              className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isActing}
            >
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

            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>

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

        <ShareDialog
          postId={post.id}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />

        <FeedbackDialog
          postId={post.id}
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          onMutate={onMutate}
        />
      </CardContent>
    </Card>
  );
}
