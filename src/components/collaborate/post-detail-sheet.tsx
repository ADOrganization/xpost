"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { addComment, deleteComment } from "@/actions/comments";
import { submitForReview, approvePost, requestChanges } from "@/actions/reviews";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostDetailSheetProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutate?: () => void;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PostDetailSheet({ postId, open, onOpenChange, onMutate }: PostDetailSheetProps) {
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const { data: post, mutate: mutatePost } = useSWR(
    postId && open ? `/api/posts/${postId}` : null,
    fetcher
  );

  const { data: commentsData, mutate: mutateComments } = useSWR(
    postId && open ? `/api/posts/${postId}/comments` : null,
    fetcher
  );

  const comments: Comment[] = commentsData?.comments ?? [];

  async function handleAddComment() {
    if (!postId || !commentText.trim()) return;
    setIsSending(true);
    try {
      const result = await addComment(postId, commentText.trim());
      if (result.success) {
        setCommentText("");
        mutateComments();
      } else {
        toast.error(result.error || "Failed to add comment");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteComment(commentId);
    if (result.success) {
      mutateComments();
    } else {
      toast.error(result.error || "Failed to delete comment");
    }
  }

  async function handleSubmitForReview() {
    if (!postId) return;
    setIsActing(true);
    try {
      const result = await submitForReview(postId);
      if (result.success) {
        toast.success("Submitted for review");
        mutatePost();
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function handleApprove() {
    if (!postId) return;
    setIsActing(true);
    try {
      const result = await approvePost(postId);
      if (result.success) {
        toast.success("Post approved");
        mutatePost();
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to approve");
      }
    } finally {
      setIsActing(false);
    }
  }

  async function handleRequestChanges() {
    if (!postId) return;
    setIsActing(true);
    try {
      const result = await requestChanges(postId, "Changes requested");
      if (result.success) {
        toast.success("Changes requested");
        mutatePost();
        onMutate?.();
      } else {
        toast.error(result.error || "Failed to request changes");
      }
    } finally {
      setIsActing(false);
    }
  }

  const firstItemText = post?.threadItems?.[0]?.text ?? "";
  const status = post?.status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Post Details
            {status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  status === "DRAFT" && "border-muted-foreground/50",
                  status === "IN_REVIEW" && "border-purple-500/50 text-purple-500",
                  status === "SCHEDULED" && "border-blue-500/50 text-blue-500",
                  status === "PUBLISHED" && "border-green-500/50 text-green-500",
                  status === "FAILED" && "border-destructive text-destructive"
                )}
              >
                {status}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Post content preview */}
          {post && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {firstItemText || "(empty)"}
                </p>
                {post.threadItems?.length > 1 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    +{post.threadItems.length - 1} more in thread
                  </p>
                )}
              </div>

              {/* Review actions */}
              {status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmitForReview}
                  disabled={isActing}
                  className="gap-1.5"
                >
                  <Clock className="size-3.5" />
                  Submit for Review
                </Button>
              )}

              {status === "IN_REVIEW" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isActing}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestChanges}
                    disabled={isActing}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <XCircle className="size-3.5" />
                    Request Changes
                  </Button>
                </div>
              )}

              <Separator />

              {/* Comments section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  Comments ({comments.length})
                </h3>

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No comments yet. Start a discussion.
                  </p>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="group flex gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      {comment.user.image && (
                        <AvatarImage src={comment.user.image} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {comment.user.name || comment.user.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground/90">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <div className="border-t pt-4 mt-auto">
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={isSending || !commentText.trim()}
              className="shrink-0 self-end"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Press Cmd+Enter to send
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
