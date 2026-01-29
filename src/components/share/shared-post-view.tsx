"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { TweetPreview } from "@/components/compose/tweet-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { MediaState } from "@/lib/types";

// ─── Types ───

interface PostMedia {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
}

interface PollOption {
  id: string;
  label: string;
  position: number;
}

interface ThreadItem {
  id: string;
  position: number;
  text: string;
  media: PostMedia[];
  pollOptions: PollOption[];
}

interface XAccount {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
}

interface Post {
  id: string;
  status: string;
  threadItems: ThreadItem[];
  xAccount?: XAccount | null;
}

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface ShareCommentData {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface SharedPostViewProps {
  post: Post;
  comments: ShareCommentData[];
  shareLinkId: string;
  token: string;
  isSignedIn: boolean;
}

// ─── Helpers ───

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  SCHEDULED: "Scheduled",
  PUBLISHING: "Publishing",
  PUBLISHED: "Published",
  FAILED: "Failed",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Component ───

export function SharedPostView({
  post,
  comments: initialComments,
  token,
  isSignedIn,
}: SharedPostViewProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, mutate } = useSWR<{ comments: ShareCommentData[] }>(
    `/api/share/${token}/comments`,
    fetcher,
    {
      fallbackData: { comments: initialComments },
      refreshInterval: 15000,
    }
  );

  const comments = data?.comments ?? initialComments;

  const displayName = post.xAccount?.displayName ?? "Author";
  const username = post.xAccount?.username ?? "user";
  const profileImageUrl = post.xAccount?.profileImageUrl ?? null;

  async function handleSubmitComment() {
    const content = commentText.trim();
    if (!content) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/share/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit comment");
        return;
      }

      setCommentText("");
      mutate();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Post Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Post Preview</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {STATUS_LABELS[post.status] ?? post.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {post.threadItems.map((item, index) => {
              const media: MediaState[] = item.media.map((m) => ({
                url: m.url,
                altText: m.altText ?? "",
                mediaType: m.mediaType,
              }));

              const pollOptions =
                index === 0
                  ? item.pollOptions.map((o) => o.label)
                  : undefined;

              return (
                <TweetPreview
                  key={item.id}
                  text={item.text}
                  media={media}
                  displayName={displayName}
                  username={username}
                  profileImageUrl={profileImageUrl}
                  pollOptions={pollOptions}
                  isThread={post.threadItems.length > 1}
                  showConnector={index < post.threadItems.length - 1}
                  hideActions
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Feedback ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing comments */}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No feedback yet. Be the first to leave a comment.
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                {comment.user.image && (
                  <AvatarImage src={comment.user.image} alt={comment.user.name ?? ""} />
                )}
                <AvatarFallback className="text-xs">
                  {(comment.user.name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.user.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}

          {/* Comment form or sign-in prompt */}
          {isSignedIn ? (
            <div className="flex gap-3 pt-2 border-t">
              <Textarea
                placeholder="Leave feedback on this post..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={isSubmitting || !commentText.trim()}
                className="shrink-0 self-end"
              >
                <Send className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <LogIn className="size-4" />
              <span>
                <a href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </a>{" "}
                to leave feedback
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
